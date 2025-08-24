const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { getCreditRecords, getCreditRecordsUsingBillId, updateCreditRecord, getCreditHistDataUsingBillID, getTotalCreditRecords, getCreditRecordsUsingPhoneNumber, getTotalCreditRecordsUsingPhoneNumber, getUserUnpaidCreditRecords, getTotalUnpaidUserCreditCounts, getCreditAmountLeftUsingBillId } = require("../data_access/creditRepo");
const { createCustomerCreditHist } = require("../data_access/billRepo");
const { addCashToLocation } = require("../data_access/locationRepo");
const { createNotificationRecord } = require("../data_access/notificationRepo");
const { parse } = require("dotenv");

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
        const mandateKeys = [
            "updated_by", "bill_id", "payment_mode_status",
            "transaction_fee", "total_given", "grand_total",
            "next_credit_date", "location_id"
        ];

        const validation = await validatePayload(payload, mandateKeys);
        if (!validation.valid) {
            return ApiResponse.response(
                resCode.INVALID_PARAMETERS,
                "failure",
                "req.body does not have valid parameters",
                []
            );
        }

        let creditCompleted = false;
        const { bill_id, updated_by, location_id, total_given, transaction_fee, payment_mode_status } = payload;

        if (updated_by.trim() !== "digital") {
            return ApiResponse.response(
            resCode.INVALID_PARAMETERS,
            "failure",
            "Unauthorized",
            {}
            );
        }


        const totalGiven = parseFloat(total_given);
        const transactionFee = parseFloat(transaction_fee);
        if (totalGiven <= 0 || transactionFee < 0) {
            return ApiResponse.response(
                resCode.INVALID_PARAMETERS,
                "failure",
                "Invalid total given or transaction fee",
                {}
            );
        }

        const grandTotal = totalGiven + transactionFee;
        if (grandTotal < totalGiven) {
            return ApiResponse.response(
                resCode.INVALID_PARAMETERS,
                "failure",
                "Grand total cannot be less than total given",
                {}
            );
        }

        // cleanup payload
        const cleanPayload = {
            ...payload,
            isdownpayment: 0
        };
        delete cleanPayload.credit_amount_left;
        delete cleanPayload.location_id;

        // create credit history
        const createHistoryRes = await createCustomerCreditHist(
            Object.keys(cleanPayload).toString(),
            Object.values(cleanPayload)
        );
        if (createHistoryRes === "error") {
            return ApiResponse.response(
                resCode.RECORD_NOT_CREATED,
                "failure",
                "Error creating customer credit history",
                {}
            );
        }

        // fetch credit amount left
        const creditAmountLeftRes = await getCreditAmountLeftUsingBillId({ bill_id });
        if (creditAmountLeftRes === "error" || creditAmountLeftRes.length === 0) {
            return ApiResponse.response(
                resCode.RECORD_NOT_FOUND,
                "failure",
                "No credit record found for the given bill ID",
                {}
            );
        }

        const creditAmountLeft = parseFloat(creditAmountLeftRes[0].credit_amount_left);
        if (creditAmountLeft < totalGiven) {
            return ApiResponse.response(
                resCode.INVALID_PARAMETERS,
                "failure",
                "Total given amount exceeds credit amount left",
                {}
            );
        }

        // calculate new credit amount
        const newCreditAmountLeft = creditAmountLeft - totalGiven;

        const updateCreditData = {
            bill_id,
            credit_amount_left: newCreditAmountLeft,
            ...(newCreditAmountLeft === 0 && { status: 1 })
        };

        if (newCreditAmountLeft === 0) creditCompleted = true;

        // cash handling
        if (payment_mode_status == "1") {
            const locationUpdateData = {
                location_id,
                cash_amount: grandTotal
            };

            const cashUpdateRes = await addCashToLocation(locationUpdateData);
            if (cashUpdateRes === "error") {
                return ApiResponse.response(
                    resCode.RECORD_NOT_CREATED,
                    "failure",
                    "Error updating cash amount"
                );
            }

            const notificationBillRes = await createNotificationRecord(
                Object.keys({
                    bill_id,
                    notification_type: 6,
                    notify_by: "NA",
                    location_id,
                    remarks: `Cash Added ${grandTotal}`,
                    status: 1
                }).toString(),
                Object.values({
                    bill_id,
                    notification_type: 6,
                    notify_by: "NA",
                    location_id,
                    remarks: `Cash Added ${grandTotal}`,
                    status: 1
                })
            );

            if (notificationBillRes === "error") {
                return ApiResponse.response(
                    resCode.RECORD_NOT_CREATED,
                    "failure",
                    "Error creating notification record"
                );
            }
        }

        // update credit table
        const updateCreditRes = await updateCreditRecord(updateCreditData);
        if (updateCreditRes === "error") {
            return ApiResponse.response(
                resCode.RECORD_NOT_CREATED,
                "failure",
                "Error updating credit record",
                {}
            );
        }

        return ApiResponse.response(
            creditCompleted ? resCode.RECORD_UPDATED : resCode.RECORD_CREATED,
            "success",
            "record_created",
            {}
        );

    } catch (error) {
        console.error(error);
        return ApiResponse.response(
            resCode.FAILURE,
            "failure",
            "Some unexpected error occurred"
        );
    }
};





module.exports = {
    getUnpaidCredits,
    getCreditDetailUsingBillId,
    getCreditHistory,
    updateCredit,
    getUnpaidCreditsByPhoneNumber,
    getUserUnpaidCredits
}