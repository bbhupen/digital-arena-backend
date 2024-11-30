const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { selectNotificationUsingLocationStatus, selectNotificationRecordUsingNotificationType, updateNotificationRecord, selectNotificationRecordUsingId, selectExpenditureRecordUsingNotificationId, createNotificationRecord } = require("../data_access/notificationRepo");
const { getPurchasesFromSalesUsingNotification, updateBillRecord, updateSalesRecord, getAllPurchaseFromSales, updateReturnBillRecord } = require("../data_access/joinRepos");
const { getBillRecordUsingBillId, getCashAndOnlineRecord, getOriginalBillIDRecord } = require("../data_access/billRepo");
const { addCashToLocation, subtractCashFromLocation } = require("../data_access/locationRepo");
const { addPurchaseQuantity } = require("../data_access/purchaseRepo");
const { getCreditHistDataUsingBill } = require("../data_access/creditHistRepo");
const { getFinanceDataUsingBillId } = require("../data_access/financeRepo");
const { disableSaleUsingSaleId, enableSaleUsingSaleId } = require("../data_access/salesRepo");
const { updateCreditStatusRecord } = require("../data_access/creditRepo");

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
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }
}

const manageNotification = async (payload) => {
    try {
        const mandateKeys = ["action_type", "notification_id"];
        const validation = await validatePayload(payload, mandateKeys);
        var bill_amount = 0;
        var purchasesFromSales;
        var bill_id;

        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        const notificationRes = await selectNotificationRecordUsingId({id: payload["notification_id"]});
        if (notificationRes.length == 0){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
        if (notificationRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        const notification_type = notificationRes[0]["notification_type"];

        if (notification_type != 4){
            purchasesFromSales = await getPurchasesFromSalesUsingNotification(payload);
            if (purchasesFromSales == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            if (purchasesFromSales.length == 0){
                return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
            }
        }

        if (payload["action_type"] == "1"){ // accept notification

            // overide notification_type

            if (notification_type == 4){
                const expenditureRes = await selectExpenditureRecordUsingNotificationId({notification_id: payload["notification_id"]});

                if (expenditureRes.length == 0){
                    return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
                }
                if (expenditureRes == "error"){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
                const locationData = {
                    cash_amount: expenditureRes[0]["cash_amount"],
                    location_id: notificationRes[0]["location_id"]
                }

                const locationRecord = await subtractCashFromLocation(locationData);
                if (locationRecord == "error"){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred", [])
                }
                if (locationRecord.affectedRows == 0){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "not enough amount to use as expenditure", [])
                } 

                const updateNotificationRes = await updateNotificationRecord({status: 1, id: payload["notification_id"]});
                if (updateNotificationRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
                return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_found", [{}]);

            }


            bill_id = purchasesFromSales[0]["bill_no"];
            const billRes = await getBillRecordUsingBillId({bill_id: bill_id});

            // check the type of notification
            const personalDiscount = await billRes[0].personal_discount;
            const payment_mode_status = await billRes[0].payment_mode_status;

            
            if (notification_type == 1){ // personal discount
                if (parseFloat(personalDiscount) > 0){ // if personal discount is applied
                    if (payment_mode_status == 1){ // if cash payment
                        bill_amount = billRes[0]["grand_total_personal"];
                    }
                    else if (payment_mode_status == 7){ // if cash and online payment
                        const cashAndOnlineRes = await getCashAndOnlineRecord({bill_id: bill_id});
                        bill_amount = cashAndOnlineRes[0]["cash_amt"];
                    }
                }
            }
            else if (notification_type == 2){ // personal credit
                if (payment_mode_status == 6){
                    // if payment mode status = 1 then add the cash to from customer_credit_rec history to location table
                    const creditHistRes = await getCreditHistDataUsingBill({bill_id: bill_id});
                    const creditPayMode = creditHistRes[0]["payment_mode_status"];
                    if (creditPayMode == 1){
                        bill_amount = creditHistRes[0]["grand_total"];
                    }
                }
                else if (payment_mode_status == 5){
                    // get the payment mode_status from finance table
                    // if 1 ask them
                    // if 6 get the payment mode status  and cash from the customer_credit_rec history
                    // 
                    const financeRes = await getFinanceDataUsingBillId({bill_id: bill_id});
                    const financePayMode = financeRes[0]["payment_mode_status"];

                    if (financePayMode == 1){ // cash
                        bill_amount = financeRes[0]["downpayment_amt"];
                    }
                    else if (financePayMode == 6){ // credit
                        const creditHistRes = await getCreditHistDataUsingBill({bill_id: bill_id});
                        const creditPayMode = creditHistRes[0]["payment_mode_status"];
                        if (creditPayMode == 1){ // cash
                            bill_amount = creditHistRes[0]["grand_total"];
                        }
                    }
                }
            }

            // update the bill datas

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
                    bill_no: bill_id,
                    status: 1
                };
                const salesUpdateRes = await updateSalesRecord(salesUpdateData);
                if (salesUpdateRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
            });
            
            const locationUpdateData = {
                location_id: billRes[0]["location_id"],
                cash_amount: bill_amount
            }
            const cashUpdateRes = await addCashToLocation(locationUpdateData);
            if (cashUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            const cashAddedNotificationData = {
                bill_id: bill_id,
                notification_type: 6,
                notify_by: "NA",
                location_id: billRes[0]["location_id"],
                remarks: "Cash Added " + bill_amount,
                status: 1
            }
    
            const notificationBillRes = await createNotificationRecord(Object.keys(cashAddedNotificationData).toString(), Object.values(cashAddedNotificationData));
            if (notificationBillRes === "error") {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating notification record");
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

            
            if (notification_type == "4"){
                const updateNotificationRes = await updateNotificationRecord({status: 0, id: payload["notification_id"]});
                if (updateNotificationRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }

                return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_found", [{}]);
            }
            
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
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "success", purchasesFromSales);

    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
        
    }
}

const manageReturnBill = async (payload) => {
    try {
        const mandateKeys = ["action_type", "notification_id"];
        const validation = await validatePayload(payload, mandateKeys);
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", [])
        }

        const notificationRes = await selectNotificationRecordUsingId({id: payload["notification_id"]});
        if (notificationRes.length == 0){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
        if (notificationRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
        const notification_type = notificationRes[0]["notification_type"];

        if (notification_type != 3){
            return ApiResponse.response(resCode.FAILURE, "failure", "invalid notification type", []);
        }

        const return_bill_id = notificationRes[0]["bill_id"];


        if (payload["action_type"] == "1"){ // accept

            // sales id from notificaition id
            const purchasesFromSales = await getAllPurchaseFromSales(payload);
            if (purchasesFromSales == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            if (purchasesFromSales.length == 0){
                return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
            }

            /*
            
            The below code block updates the sales table and purchase table:


            
            * disable all the sales with id from purchasesFromSales
            * loop thorugh the purchasesFromSales and disable the sales using the function disableSaleUsingSaleId and also add the sale quantity to purchaseTable
            
            
            */


            for (const purchase of purchasesFromSales) {
                const enableReturnSale = await enableSaleUsingSaleId({ sales_id: purchase.sales_id });
                if (enableReturnSale == 'error') {
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred");
                }

                const purchaseUpdateRes = await addPurchaseQuantity({purchase_id: purchase.purchase_id, sale_quantity: purchase.sale_quantity});
                if (purchaseUpdateRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
            }

            const billUpdateData = {
                bill_id: return_bill_id,
                status: 1
            }


            /**
             * The below code block updates the bill table:
             * 
             */


            const updateNotificationRes = await updateNotificationRecord({status: 1, id: payload["notification_id"]});
            if (updateNotificationRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            /**
             * The below code block updates the notification table:
             * 
             */

            const billDisableRes = await updateBillRecord(billUpdateData);
            if (billDisableRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            // console.log(purchasesFromSales);
            
        }
        else if (payload["action_type"] == "0")
        { // reject
            /**
             * update customer credit status = 2 where originial bill id = bill id
             * 
             */
            const billIDRes = await getOriginalBillIDRecord({return_bill_id: return_bill_id});
            if (billIDRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            if (billIDRes.length == 0){
                return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
            }

            const original_bill_id = (billIDRes[0].bill_id);
            const original_bill_details = await getBillRecordUsingBillId({bill_id: original_bill_id});
            if (original_bill_details == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            if (original_bill_details.length == 0){
                return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
            }
            const payment_mode_status = original_bill_details[0].payment_mode_status;


            /**
             * Disable return sales 
            */
            const purchasesFromSales = await getAllPurchaseFromSales(payload);
            if (purchasesFromSales == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }
            if (purchasesFromSales.length == 0){
                return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
            }

            for (const purchase of purchasesFromSales) {
                const disableReturnSale = await disableSaleUsingSaleId({ sales_id: purchase.sales_id });
                if (disableReturnSale == 'error') {
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred");
                }
            }



            /**
             * if payment mode credit, disable all the shitsss 
             */
            if (payment_mode_status == 6){ 
                const updateCreditStatusData = {
                    bill_id: original_bill_id,
                    status: 1
                }

                const updateCreditStatusRes = await updateCreditStatusRecord(updateCreditStatusData);
                if (updateCreditStatusRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }
            }

            const updateNotificationRes = await updateNotificationRecord({status: 1, id: payload["notification_id"]});
            if (updateNotificationRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            // const billUpdateData = {
            //     bill_id: return_bill_id,
            //     status: 0
            // }
            // const billEnableRes = await updateBillRecord(billUpdateData);
            // if (billEnableRes == 'error'){
            //     return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            // }


            /**
             * 
             * Update Return Bill status to 0
             * 
             */
            const returnBillData = {
                bill_id: return_bill_id,
                status: 0
            }
            const returnBillRes = await updateBillRecord(returnBillData);
            if (returnBillRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

            /**
             * update return bill info to status 0
             */

            const returnBillInfoData = {
                bill_id: return_bill_id,
                status: 0
            }

            const returnBillInfoRes = await updateReturnBillRecord(returnBillInfoData);
            if (returnBillInfoRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

        }
        else
        {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters", []);
        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "success", []);


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
        
    }
}

module.exports = {
    getNotificationByNotificationType,
    manageNotification,
    manageReturnBill
};