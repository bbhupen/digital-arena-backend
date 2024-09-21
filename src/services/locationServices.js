const { getAllLocationRecord, addCashToLocation, subtractCashFromLocation } = require("../data_access/locationRepo");
const { createNotificationRecord } = require("../data_access/notificationRepo");
const ApiResponse = require("../helpers/apiresponse");
const resCode = require("../helpers/responseCodes");
const { validatePayload } = require("../helpers/utils");

const getAllLocation = async () => {
    try {
        const locationRecord = await getAllLocationRecord();
        if (!locationRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found");
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", locationRecord);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
    
}

const collectAmountFromLocation = async (payload) => {
    try {
        const mandateKeys = ["location_id", "amount", "collected_by"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        const notificationData = {
            bill_id: "NA",
            notification_type: 5,
            notify_by: payload["collected_by"],
            location_id: payload["location_id"],
            remarks: payload["amount"] + " amount collected from location",
            status: 1
        }

        const notificationRes = await createNotificationRecord(Object.keys(notificationData).toString(), Object.values(notificationData));
        if (notificationRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
        }

        const locationData = {
            cash_amount: payload["amount"],
            location_id: payload["location_id"]
        }

        const locationRecord = await subtractCashFromLocation(locationData);
        if (locationRecord == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
        }

        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_created", payload);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}
 
module.exports = {
    getAllLocation,
    collectAmountFromLocation
};