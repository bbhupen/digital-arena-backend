const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { selectNotificationUsingLocationStatus, selectNotificationRecordUsingNotificationType } = require("../data_access/notificationRepo");

const getNotificationByNotificationType = async (payload) => {
    try {
        const mandateKeys = ["notification_type", "location_id"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }
        
        const notificationRecord = await selectNotificationRecordUsingNotificationType(payload);
        if (!notificationRecord){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }

        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", notificationRecord);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

const manageNotification = async (payload) => {
    try {
        const mandateKeys = ["action_type", "notification_id"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        /*
        if notification type =  accept then update the status to 1
            -- bill table
            -- add cash amount to balance table - location table
            -- sale table
            -- notification table

        if notification type =  reject then update the status to 0
            -- subtract cash amount from balance table - location table
            -- add the purchase quantity to the purchase table
            -- bill table
            -- sale table
            -- notification table
         */
            return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", payload);

    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
        
    }
}

module.exports = {
    getNotificationByNotificationType,
    manageNotification
};