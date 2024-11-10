const { getAllLocationRecord, addCashToLocation, subtractCashFromLocation, getLocationDetails } = require("../data_access/locationRepo");
const { createNotificationRecord, createExpenditureInNotification } = require("../data_access/notificationRepo");
const { selectUserUsingUsername } = require("../data_access/userRepo");
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

        const locationDetails = await getLocationDetails(payload["location_id"]);
        const locationName = locationDetails[0]["location_name"];

        const notificationData = {
            bill_id: "NA",
            notification_type: 5,
            notify_by: payload["collected_by"],
            location_id: payload["location_id"],
            remarks: payload["amount"] + " amount collected from " + locationName + " by " + payload["collected_by"],
            status: 1
        }

        const locationData = {
            cash_amount: payload["amount"],
            location_id: payload["location_id"]
        }

        const locationRecord = await subtractCashFromLocation(locationData);

        if (locationRecord == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
        }

        if (locationRecord.affectedRows == 0){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "not enough amount to collect", [])
        }

        const notificationRes = await createNotificationRecord(Object.keys(notificationData).toString(), Object.values(notificationData));
        if (notificationRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
        }

        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_created", payload);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

const createExpenditureRecord = async (payload) => {
    try {
        const mandateKeys = ["location_id", "amount", "created_by", "remarks"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        var status = 2;
        const locationDetails = await getLocationDetails(payload["location_id"]);
        const locationName = locationDetails[0]["location_name"];


        const userData = await selectUserUsingUsername({username: payload["created_by"].trim()});
        if (userData.length == 0){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "user not found", [])
        }

        if (userData[0]["role_id"] == "1"){
            status = 1;
            const locationData = {
                cash_amount: payload["amount"],
                location_id: payload["location_id"]
            }

            const locationRecord = await subtractCashFromLocation(locationData);
            if (locationRecord == "error"){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
            }
            if (locationRecord.affectedRows == 0){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "not enough amount to use as expenditure", [])
            }   
        }

        const notificationData = {
            bill_id: "NA",
            notification_type: 4,
            notify_by: payload["created_by"],
            location_id: payload["location_id"],
            remarks: payload["remarks"] + " ("+ payload["amount"] + " expenditure by " + payload["created_by"] + " at " + locationName + ")",
            status: status
        }
        const notificationRes = await createNotificationRecord(Object.keys(notificationData).toString(), Object.values(notificationData));
        if (notificationRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
        }
        
        const expenditureData = {
            notification_id: notificationRes.id,
            cash_amount: payload["amount"],
        }

        const expenditureRes = await createExpenditureInNotification(Object.keys(expenditureData).toString(), Object.values(expenditureData));
        if (expenditureRes == "error"){
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
    collectAmountFromLocation,
    createExpenditureRecord
};