const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { selectNotificationUsingLocationStatus, selectNotificationRecordUsingNotificationType, updateNotificationRecord, selectNotificationRecordUsingId } = require("../data_access/notificationRepo");
const { getPurchasesFromSalesUsingNotification, updateBillRecord, updateSalesRecord } = require("../data_access/joinRepos");
const { getBillRecordUsingBillId } = require("../data_access/billRepo");
const { addCashToLocation } = require("../data_access/locationRepo");
const { addPurchaseQuantity } = require("../data_access/purchaseRepo");

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

        const purchasesFromSales = await getPurchasesFromSalesUsingNotification(payload);

        if (purchasesFromSales == 'error'){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        if (purchasesFromSales.length == 0){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }

        const bill_id = purchasesFromSales[0]["bill_no"];

        if (payload["action_type"] == "1"){ // accept notification

            // check the type of notification
            // const notificationRes = await selectNotificationRecordUsingId({id: payload["notification_id"]});

            // console.log(notificationRes[0]["notification_type"])
            // // if (notificationRes[0]["notification_type"] == 1){
            // //     console.log(1)
            // // }

            const billUpdateData = {
                bill_id: bill_id,
                status: 1
            }
            const billUpdateRes = await updateBillRecord(billUpdateData);
            if (billUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            purchasesFromSales.map(async purchase => {    
                const salesUpdateData = {
                    purchase_id: purchase.purchase_id,
                    bill_no: purchase.bill_no,
                    status: 1
                };
                const salesUpdateRes = await updateSalesRecord(salesUpdateData);
                if (salesUpdateRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
            });

            const billRes = await getBillRecordUsingBillId({bill_id: bill_id});
            const personalDiscount = billRes[0]["personal_discount"];
            var bill_amount = 0;

            if (personalDiscount > 0){
                bill_amount =  billRes[0]["grand_total_personal"];
            }
            else
            {
                bill_amount = billRes[0]["grand_total_bill"];
            }
            const locationUpdateData = {
                location_id: billRes[0]["location_id"],
                cash_amount: bill_amount
            }
            const cashUpdateRes = await addCashToLocation(locationUpdateData);
            if (cashUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            const updateNotificationRes = await updateNotificationRecord({status: 1, id: payload["notification_id"]});
            if (updateNotificationRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }


            // if notification type =  accept then update the status to 1
            // -- bill table
            // -- add cash amount to balance table - location table
            // -- sale table
            // -- notification table
        }
        else if (payload["action_type"] == "0") // reject notification
        {
            
            const billUpdateData = {
                bill_id: bill_id,
                status: 0
            }
            const billUpdateRes = await updateBillRecord(billUpdateData);
            if (billUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }


            purchasesFromSales.map(async purchase => {    
                const salesUpdateData = {
                    purchase_id: purchase.purchase_id,
                    bill_no: purchase.bill_no,
                    status: 0
                };
                const purchaseUpdateRes = await addPurchaseQuantity({purchase_id: purchase.purchase_id, sale_quantity: purchase.sale_quantity});
                if (purchaseUpdateRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }


                const salesUpdateRes = await updateSalesRecord(salesUpdateData);
                if (salesUpdateRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
            });

            const updateNotificationRes = await updateNotificationRecord({status: 0, id: payload["notification_id"]});
            if (updateNotificationRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }


            // if notification type =  reject then update the status to 0
            // -- add the purchase quantity to the purchase table
            // -- bill table
            // -- sale table
            // -- notification table
        }
        else
        {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }
        
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", purchasesFromSales);

    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
        
    }
}

module.exports = {
    getNotificationByNotificationType,
    manageNotification
};