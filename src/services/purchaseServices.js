const { getPurchaseByID } = require("../data_access/purchaseRepo");
const ApiResponse = require("../helpers/apiresponse");
const resCode = require("../helpers/responseCodes");
const { validatePayload } = require("../helpers/utils");

const getPurchaseDetails = async (payload) => {
    try {
        const mandateKeys = ["purchase_id"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }
        
        const purchaseRecord = await getPurchaseByID(payload);
        if (!purchaseRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found");
        }

        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", purchaseRecord);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }


}

module.exports = {
    getPurchaseDetails
};