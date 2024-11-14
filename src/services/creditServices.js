const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { getCreditRecords, getCreditRecordsUsingBillId, updateCreditRecord } = require("../data_access/creditRepo");
const { createCustomerCreditHist } = require("../data_access/billRepo");

const getUnpaidCredits = async (payload) => {
    try {
        const customerCredits = await getCreditRecords();

        if (customerCredits == "error") {
            return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred", []);
        }

        if (customerCredits.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", customerCredits);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
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
            return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred", []);
        }
        if (creditDetails.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }

        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", creditDetails);


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

const getCreditHistory = async (payload) => {
    try{
        const mandateKeys = ["bill_id"];
        const validation = await validatePayload(payload, mandateKeys);
        
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const creditHistory = await getCreditDetailUsingBillId(payload);
        if (creditHistory == "error") {
            return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred", []);
        }
        if (creditHistory.length == 0) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", creditHistory);

    }
    catch(error){
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}


const updateCredit = async (payload) => {
    try {
        const mandateKeys = ["updated_by", "bill_id", "payment_mode_status", "transaction_fee", "total_given", "grand_total", "next_credit_date", "credit_amount_left"]
        const validation = await validatePayload(payload, mandateKeys);
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        const { credit_amount_left } = payload;


        payload["isdownpayment"] = 0;
        delete payload.credit_amount_left


        // create credit hist
        const createCustomerCreditHistoryRes = await createCustomerCreditHist(Object.keys(payload).toString(), Object.values(payload))
        if (createCustomerCreditHistoryRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record", {});
        }

        // update credit table
        const updateCreditData = {
            "bill_id": payload["bill_id"],
            "credit_amount_left": credit_amount_left
        }

        // add cash amount

        const updateCreditRes = await updateCreditRecord(updateCreditData);
        if (updateCreditRes === "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record", {});
        }
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_created", {});

    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error");
    }
}




module.exports = {
    getUnpaidCredits,
    getCreditDetailUsingBillId,
    getCreditHistory,
    updateCredit
}