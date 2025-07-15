const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { getCreditRecords, getCreditRecordsUsingBillId, updateCreditRecord, getCreditHistDataUsingBillID, getTotalCreditRecords, getCreditRecordsUsingPhoneNumber, getTotalCreditRecordsUsingPhoneNumber, getUserUnpaidCreditRecords, getTotalUnpaidUserCreditCounts } = require("../data_access/creditRepo");
const { createCustomerCreditHist } = require("../data_access/billRepo");
const { addCashToLocation } = require("../data_access/locationRepo");
const { createNotificationRecord } = require("../data_access/notificationRepo");

const getUnpaidCredits = async (payload) => {
    try {
        const mandateKeys = ["start", "limit"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const customerCredits = await getCreditRecords(payload);
        if (customerCredits == "error") {
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred", {});
        }
        if (customerCredits.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", {});
        }

        const totalCredits = await getTotalCreditRecords();
        const totalCreditCount = totalCredits[0]["totalCount"]
        const res = {
            totalRecords: totalCreditCount,
            recordsFetched: customerCredits
        }
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}

const getUserUnpaidCredits = async (payload) => {
    try {
        const mandateKeys = ["start", "limit"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        if (!payload.hasOwnProperty("name")) {
            payload.name = "";
        }

        const customerCreditsPromise = getUserUnpaidCreditRecords(payload);
        const totalCreditsPromise = getTotalUnpaidUserCreditCounts(payload);


        const [customerCredits, totalCredits] = await Promise.all([
            customerCreditsPromise,
            totalCreditsPromise
        ]);

        if (customerCredits == "error") {
            return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred", {});
        }

        if (customerCredits.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", {});
        }

        const totalRecords = totalCredits[0]?.["totalCount"] || 0;
        const res = {
            totalRecords,
            recordsFetched: customerCredits
        }

        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}

const getUnpaidCreditsByPhoneNumber = async (payload) => {
    try {
        const mandateKeys = ["phone_number", "start", "limit"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }
        
        const customerCreditsPromise = getCreditRecordsUsingPhoneNumber(payload);
        const totalCreditsPromise = getTotalCreditRecordsUsingPhoneNumber(payload);

        const [customerCredits, totalCredits] = await Promise.all([
            customerCreditsPromise,
            totalCreditsPromise
        ]);

        if (customerCredits == "error") {
            return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred", {});
        }
        if (customerCredits.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", {});
        }
        const totalRecords = totalCredits?.[0]?.totalCount || 0;
        const res = {
            totalRecords,
            recordsFetched: customerCredits
        }
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);

        
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}

const getCreditDetailUsingBillId = async (payload) => {
    try {
        const mandateKeys = ["bill_id"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const creditDetails = await getCreditRecordsUsingBillId(payload);
        if (creditDetails == "error") {
            return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred", []);
        }
        if (creditDetails.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }

        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", creditDetails[0]);


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}

const getCreditHistory = async (payload) => {
    try{
        const mandateKeys = ["bill_id"];
        const validation = await validatePayload(payload, mandateKeys);
        
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const creditHistory = await getCreditHistDataUsingBillID(payload);
        if (creditHistory == "error") {
            return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred", []);
        }
        if (creditHistory.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", creditHistory);

    }
    catch(error){
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}


const updateCredit = async (payload) => {
    try {
        const mandateKeys = ["updated_by", "bill_id", "payment_mode_status", "transaction_fee", "total_given", "grand_total", "next_credit_date", "credit_amount_left", "location_id"]
        const validation = await validatePayload(payload, mandateKeys);
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        var creditCompleted = false;
        const { bill_id, credit_amount_left, updated_by, location_id, grand_total } = payload;


        payload["isdownpayment"] = 0;
        delete payload.credit_amount_left;
        delete payload.location_id;


        // create credit hist
        const createCustomerCreditHistoryRes = await createCustomerCreditHist(Object.keys(payload).toString(), Object.values(payload))
        if (createCustomerCreditHistoryRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record", {});
        }

        // update credit table
        const updateCreditData = {
            "bill_id": bill_id,
            "credit_amount_left": credit_amount_left
        }

        if (parseFloat(credit_amount_left) == 0) { 
            updateCreditData["status"] = 1;
            creditCompleted = true;
        }
        // add cash amount
        if (payload["payment_mode_status"] == "1"){
            const cash_amount = grand_total;
            const locationUpdateData = {
                location_id: location_id,
                cash_amount: cash_amount
            }
            const cashUpdateRes = await addCashToLocation(locationUpdateData);
            if (cashUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            const cashAddedNotificationData = {
                bill_id: bill_id,
                notification_type: 6,
                notify_by: "NA",
                location_id: location_id,
                remarks: "Cash Added " + cash_amount,
                status: 1
            }
    
            const notificationBillRes = await createNotificationRecord(Object.keys(cashAddedNotificationData).toString(), Object.values(cashAddedNotificationData));
            if (notificationBillRes === "error") {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating notification record");
            }
        }

        const updateCreditRes = await updateCreditRecord(updateCreditData);
        if (updateCreditRes === "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record", {});
        }

        if (creditCompleted){
            return ApiResponse.response(resCode.RECORD_UPDATED, "success", "record_created", {});    
        }
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_created", {});

    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error");
    }
}




module.exports = {
    getUnpaidCredits,
    getCreditDetailUsingBillId,
    getCreditHistory,
    updateCredit,
    getUnpaidCreditsByPhoneNumber,
    getUserUnpaidCredits
}