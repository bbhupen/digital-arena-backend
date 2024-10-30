const { getLocationDetails, getLocationById } = require("../data_access/locationRepo");
const { getPurchaseByID, updatePurchasePhysicallyVerified, updatePurchaseLocationID } = require("../data_access/purchaseRepo");
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

const physicallyVerifyPurchase = async (payload) => {
    try {
        const mandateKeys = ["purchase_id", "purchase_quantity"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }
        const purchaseQuantity = parseInt(payload["purchase_quantity"]);
        if (purchaseQuantity <= 0){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "purchase_quantity should be greater than 0");
        }

        const purchaseRecord = await getPurchaseByID(payload);
        if (!purchaseRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found");
        }

        if (purchaseRecord['physically_verified_status'] == 1){
            return ApiResponse.response(resCode.RECORD_ALREADY_EXISTS, "success", "already verified");
        }

        const isUpdated = await updatePurchasePhysicallyVerified(payload);
        if (isUpdated=="error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }


        return ApiResponse.response(resCode.RECORD_MODIFIED, "success", "purchase verified", {});
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }


}

const updatePurchaseLocation = async (payload) => {
    try {
        const mandateKeys = ["purchase_id", "location_id"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", {})
        }

        const purchaseRecord = await getPurchaseByID(payload);
        if (!purchaseRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no purchase record found", {});
        }

        const locationRecord = await getLocationById(payload["location_id"]);
        if (!locationRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no location record found", {});
        }

        const isUpdated = await updatePurchaseLocationID(payload);
        if (isUpdated=="error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", {})
        }

        return ApiResponse.response(resCode.RECORD_MODIFIED, "success", "purchase location updated", {});


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

module.exports = {
    getPurchaseDetails,
    physicallyVerifyPurchase,
    updatePurchaseLocation
};