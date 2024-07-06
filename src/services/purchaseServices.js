const { getPurchaseByID } = require("../data_access/purchaseRepo");
const ApiResponse = require("../helpers/apiresponse");

const getPurchaseDetails = async (payload) => {
    const mandateKeys = ["purchase_id"];
    const hasRequiredFields = mandateKeys.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
    }
    const { purchase_id } = payload;

    if (purchase_id.trim().length === 0){
        return ApiResponse.response("failure", "Please provide valid parameters")
    }
    
    const purchaseRecord = await getPurchaseByID(payload);
    if (!purchaseRecord){
        return ApiResponse.response("success", "no_record_found");
    }

    return ApiResponse.response("success", "record_found", purchaseRecord);

}

module.exports = {
    getPurchaseDetails
};