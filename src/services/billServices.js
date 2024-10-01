const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { createBillRecord, getLatestBillId, getCurrentFinYear, getBillRecordUsingCustomerID, createCreditBillRecord, createCustomerCredit, createCustomerCreditHist, createFinanceBillRecord, createCashAndOnlineRecord, getLatestBillIdUsingFinancialYear } = require("../data_access/billRepo");
const { updateSalesRecordinBill } = require("../data_access/salesRepo");
const { updatePurchaseQuantity } = require("../data_access/purchaseRepo");
const { searchCustomerUsingID, createBillCustomerRecord } = require("../data_access/customerRepo");
const { createNotificationRecord } = require("../data_access/notificationRepo");
const { addCashToLocation } = require("../data_access/locationRepo");
const { generateBillId } = require("../helpers/generateBillId");

const createBill = async (payload) => {
    try {
        // Validate payload
        const mandateKeys = ["customer_id", "sales_id", "location_id", "card_no_upi_id", "payment_mode_status", "transaction_fee", "net_total", "grand_total_bill", "personal_discount", "sale_by"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters");
        }
        // Get the latest bill ID



        // bill id genration start
        const current_fin_year = await getCurrentFinYear();
        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }
        const maxBillId = await getLatestBillIdUsingFinancialYear({ financial_year: current_fin_year[0].year });
        var bill_sl_no = parseInt(maxBillId[0]?.bill_sl_no || 0) + 1;
        const bill_id = generateBillId(current_fin_year[0].year, bill_sl_no);
        // bill id generation end

        
        var cash_amount = 0;
        var status = 1;
        var notification_type = 0;
        var remarks = "";

        // setting the status for the bill in case of credit or personal discount
        if (payload.payment_mode_status == "6" || payload.personal_discount > 0){
            const mandateKeys = ["customer_id", "sales_id", "location_id", "card_no_upi_id", "payment_mode_status", "transaction_fee", "net_total", "grand_total_bill", "personal_discount", "sale_by", "remarks"];
            const validation = await validatePayload(payload, mandateKeys);

            if (!validation.valid) {
                return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters");
            }
            remarks = payload.remarks;
            status = 2;
        }

        payload = {
            ...payload,
            bill_sl_no,
            bill_id,
            status: status,
            cfin_yr: current_fin_year[0].year
        };

        const { sales_id, purchase_id, sale_quantity, customer_id, payment_mode_status, personal_discount, location_id, sale_by } = payload;
        let online_payment_mode = "";
        let grand_total_personal = 0;
        let personal_discount_status = 0;

        if (personal_discount > 0) {
            personal_discount_status = 1;
            notification_type = 1;
            grand_total_personal = parseInt(payload.grand_total_bill) - parseInt(personal_discount); 
            
            if (payment_mode_status == "1"){
                cash_amount = grand_total_personal;
            }
        }

        // Remove unnecessary keys for the bill creation
        const billPayload = { ...payload, grand_total_personal, personal_discount_status };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;
        delete billPayload.cash_amt;
        delete billPayload.online_amt;
        delete billPayload.online_payment_mode;
        delete billPayload.sale_by;
        delete billPayload.remarks;

        // Create bill
        const createBillRes = await createBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));

        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
        }

        // Create cash and online record
        if (payment_mode_status == "1"){
            cash_amount = payload["grand_total_bill"];
        }

        if (payment_mode_status === "7"){
            cash_amount = payload.cash_amt;
            cash_amt = payload.cash_amt;
            online_amt = payload.online_amt;
            online_payment_mode = payload.online_payment_mode;
    
            const cash_and_online_data = { bill_id, cash_amt, online_amt, online_payment_mode };
            const createCashAndOnlineRes = await createCashAndOnlineRecord(Object.keys(cash_and_online_data).toString(), Object.values(cash_and_online_data));
    
            if (createCashAndOnlineRes === "error") {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating cash and online record");
            }
        }

        const saleData = { 
            bill_no: bill_id, 
            status: status, 
            sales_id
        };

        const notificationRecordData = {
            bill_id: bill_id,
            notification_type: notification_type,
            notify_by: sale_by,
            location_id: location_id,
            remarks: remarks,
            status: status
        }

        const notificationBillRes = await createNotificationRecord(Object.keys(notificationRecordData).toString(), Object.values(notificationRecordData));
        if (notificationBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating notification record");
        }

        // Update purchase stock
        for (let i = 0; i < purchase_id.length; i++) {
            const updatePurchaseData = { purchase_id: purchase_id[i], sale_quantity: sale_quantity[i] };
            const updatePurchaseRes = await updatePurchaseQuantity(updatePurchaseData);

            if (!updatePurchaseRes.affectedRows) {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Stock exhausted");
            }
        }

        // Update sales record
        const updateSaleRes = await updateSalesRecordinBill(saleData);
        if (updateSaleRes === "invalid_id") {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Invalid sales ID");
        }
        if (updateSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while updating sales record");
        }

        // Update bill customer record
        const billCustomerData = (await searchCustomerUsingID({ customer_id }))[0];
        delete billCustomerData.customer_id;
        delete billCustomerData.inserted_at;
        billCustomerData["bill_id"] = bill_id;

        const keys1 = Object.keys(billCustomerData).toString();
        const values = Object.keys(billCustomerData)
            .map((key) =>
                billCustomerData[key]
            )

        const createBillCustomerRes = await createBillCustomerRecord(keys1, values);


        // Return successful response
        if (status == 2){
            return ApiResponse.response(resCode.REQUEST_SENT, "success", "Request Sent for admin to approve", payload);
        }
        else if (status == 1)
        {
            // Update Collectable Cash
            const locationUpdateData = {
                location_id: location_id,
                cash_amount: cash_amount
            }
            const cashUpdateRes = await addCashToLocation(locationUpdateData);
            if (cashUpdateRes == 'error'){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
            }

        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "Record inserted", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}

const searchBillUsingCustomerId = async (payload) =>{
    try {
        const mandateKeys = ["customer_id", "start"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const res = await getBillRecordUsingCustomerID(payload);

        if (!res.length){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);    
        }

        if (res=="error"){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "some unexpected error occurred", []);    
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);   


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

const createCreditBill = async (payload) => {
    try {
        const mandateKeys = ["customer_id", "purchase_id", "sales_id", "payment_mode_status", "location_id", "card_no_upi_id", "transaction_fee", "net_total", "grand_total_bill", "total_credit_amt", "credit_amount_left", "customer_credit_date", "grand_total_credit_amount", "sale_by", "credit_amount_paid" ];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters");
        }

        const [current_fin_year] = await Promise.all([
            getCurrentFinYear()
        ]);

        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }

        const status = 2;

        const maxBillId = await getLatestBillIdUsingFinancialYear({ financial_year: current_fin_year[0].year });
        var bill_sl_no = parseInt(maxBillId[0]?.bill_sl_no || 0) + 1;
        const bill_id = generateBillId(current_fin_year[0].year, bill_sl_no);

        const { sales_id, purchase_id, sale_quantity, customer_id, credit_amount_left, credit_amount_paid, customer_credit_date, transaction_fee, card_no_upi_id, grand_total_bill, grand_total_credit_amount, location_id, sale_by, remarks } = payload;
        var { payment_mode_status } = payload;
        delete payload.transaction_fee;
        delete payload.payment_mode_status;

        if (credit_amount_paid == "0"){
            payment_mode_status = 0;
        }
        payload = {
            ...payload,
            bill_id,
            bill_sl_no,
            status: status,
            transaction_fee: 0,
            payment_mode_status: "6",
            cfin_yr: current_fin_year[0].year
        };

        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;``
        delete billPayload.total_credit_amt;
        delete billPayload.credit_amount_left;
        delete billPayload.customer_credit_date;
        delete billPayload.credit_amount_paid;
        delete billPayload.grand_total_credit_amount;
        delete billPayload.sale_by;
        delete billPayload.remarks;

        const createBillRes = await createCreditBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));
        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
        }

        const customerCreditData = { 
            bill_id: bill_id, 
            status: 2, 
            total_credit_amt: grand_total_bill, 
            credit_amount_left: credit_amount_left 
        };

        const customerCreditHistoryData = { 
            bill_id: bill_id, 
            payment_mode_status: payment_mode_status, 
            card_no_upi_id: card_no_upi_id,
            transaction_fee: transaction_fee, 
            total_given: credit_amount_paid, 
            grand_total: grand_total_credit_amount, 
            next_credit_date: customer_credit_date,
            updated_by: sale_by,
            isdownpayment: 1 
        };

        const notificationRecordData = {
            bill_id: bill_id,
            notification_type: 2,
            notify_by: sale_by,
            location_id: location_id,
            remarks: remarks,
            status: status
        }

        const [createCustomerCreditRes, createCustomerCreditHistoryRes] = await Promise.all([
            createCustomerCredit(Object.keys(customerCreditData).toString(), Object.values(customerCreditData)),
            createCustomerCreditHist(Object.keys(customerCreditHistoryData).toString(), Object.values(customerCreditHistoryData))
        ]);
        if (createCustomerCreditRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit record");
        }
        if (createCustomerCreditHistoryRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record");
        }

        const purchasePromises = purchase_id.map((id, index) => {
            const updatePurchaseData = { purchase_id: id, sale_quantity: sale_quantity[index] };
            return updatePurchaseQuantity(updatePurchaseData);
        });

        const purchaseResults = await Promise.all(purchasePromises);
        const failedPurchaseIndex = purchaseResults.findIndex(result => !result.affectedRows);
        if (failedPurchaseIndex !== -1) {
            const failedPurchaseId = purchase_id[failedPurchaseIndex];
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", `Stock exhausted for purchase_id: ${failedPurchaseId}`, { purchase_id: failedPurchaseId });
        }

        const notificationBillRes = await createNotificationRecord(Object.keys(notificationRecordData).toString(), Object.values(notificationRecordData));
        if (notificationBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating notification record");
        }

        const data = { 
            bill_no: bill_id, 
            status: status, 
            sales_id 
        };


        const [updateSaleRes] = await Promise.all([
            updateSalesRecordinBill(data)
        ]);

        if (updateSaleRes === "invalid_id") {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Invalid sales ID");
        }
        if (updateSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while updating sales record");
        }

        const billCustomerData = (await searchCustomerUsingID({ customer_id }))[0];
        delete billCustomerData.customer_id;
        delete billCustomerData.inserted_at;
        billCustomerData["bill_id"] = bill_id;

        const keys1 = Object.keys(billCustomerData).toString();
        const values = Object.keys(billCustomerData)
            .map((key) =>
                billCustomerData[key]
            )

        const createBillCustomerRes = await createBillCustomerRecord(keys1, values);


        return ApiResponse.response(resCode.REQUEST_SENT, "success", "Request Sent for admin to approve", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}

const createFinanceBill = async (payload) => {
    try {
        // Validate payload
        const mandateKeys = ["customer_id", "sales_id", "payment_mode_status", "card_no_upi_id", "financer_name", "location_id", "transaction_fee", "net_total", "grand_total_bill", "downpayment_amt", "dispersed_amt", "other_fee" ];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters");
        }

        var cash_amount = 0;

        // bill id genration start
        const current_fin_year = await getCurrentFinYear();
        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }
        const maxBillId = await getLatestBillIdUsingFinancialYear({ financial_year: current_fin_year[0].year });
        var bill_sl_no = parseInt(maxBillId[0]?.bill_sl_no || 0) + 1;
        const bill_id = generateBillId(current_fin_year[0].year, bill_sl_no);
        // bill id generation end

        const { sales_id, purchase_id, sale_quantity, customer_id, card_no_upi_id, downpayment_amt, dispersed_amt, transaction_fee, other_fee ,financer_name, payment_mode_status, location_id } = payload;
        let cash_amt = "";
        let online_amt = "";
        let online_payment_mode = "";

        delete payload.transaction_fee;
        delete payload.payment_mode_status;

        payload = {
            ...payload,
            bill_id,
            bill_sl_no,
            payment_mode_status: "5",
            status: "1",
            cfin_yr: current_fin_year[0].year
        };

        // Remove unnecessary keys for the bill creation
        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;
        delete billPayload.transaction_fee;
        delete billPayload.downpayment_amt;
        delete billPayload.other_fee;
        delete billPayload.financer_name;
        delete billPayload.dispersed_amt;



        // Create cash and online record
        
        if (payment_mode_status == "1"){
            cash_amount = payload["grand_total_bill"];
        }

        if (payment_mode_status === "7"){
            cash_amount = payload.cash_amt;
            cash_amt = payload.cash_amt;
            online_amt = payload.online_amt;
            online_payment_mode = payload.online_payment_mode;
    
            const cash_and_online_data = { bill_id, cash_amt, online_amt, online_payment_mode };
            const createCashAndOnlineRes = await createCashAndOnlineRecord(Object.keys(cash_and_online_data).toString(), Object.values(cash_and_online_data));

            if (createCashAndOnlineRes === "error") {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating cash and online record");
            }
        }

        delete billPayload.cash_amt;
        delete billPayload.online_amt;
        delete billPayload.online_payment_mode;

        // Create bill
        const createBillRes = await createCreditBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));

        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
        }

        const financeBillData = { 
            bill_id: bill_id, 
            financer_name: financer_name,
            payment_mode_status: payment_mode_status,
            card_no_upi_id: card_no_upi_id,
            transaction_fee: transaction_fee,
            downpayment_amt: downpayment_amt,
            dispersed_amt: dispersed_amt,
            other_fee: other_fee
        };

        const financeBillRes = await createFinanceBillRecord(Object.keys(financeBillData).toString(), Object.values(financeBillData));

        if (financeBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while finance bill record");
        }

        const data = { bill_no: bill_id, status: 1, sales_id };
        // Update purchase stock
        for (let i = 0; i < purchase_id.length; i++) {
            const updatePurchaseData = { purchase_id: purchase_id[i], sale_quantity: sale_quantity[i] };
            const updatePurchaseRes = await updatePurchaseQuantity(updatePurchaseData);

            if (!updatePurchaseRes.affectedRows) {
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Stock exhausted");
            }
        }

        // Update sales record
        const updateSaleRes = await updateSalesRecordinBill(data);
        if (updateSaleRes === "invalid_id") {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Invalid sales ID");
        }
        if (updateSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while updating sales record");
        }

        // Update Collectable Cash
        const locationUpdateData = {
            location_id: location_id,
            cash_amount: cash_amount
        }
        const cashUpdateRes = await addCashToLocation(locationUpdateData);
        if (cashUpdateRes == 'error'){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
            

        const billCustomerData = (await searchCustomerUsingID({ customer_id }))[0];
        delete billCustomerData.customer_id;
        delete billCustomerData.inserted_at;
        billCustomerData["bill_id"] = bill_id;

        const keys1 = Object.keys(billCustomerData).toString();
        const values = Object.keys(billCustomerData)
            .map((key) =>
                billCustomerData[key]
            )

        const createBillCustomerRes = await createBillCustomerRecord(keys1, values);


        // Return successful response
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "Record inserted", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}

const createFinanceCreditBill = async (payload) => {
    try {
        const mandateKeys = ["customer_id", "purchase_id", "sales_id", "location_id",  "net_total", "downpayment_amt", "dispersed_amt", "card_no_upi_id", "other_fee", "total_credit_amt", "credit_amount_left", "payment_mode_status", "credit_amount_paid", "grand_total_credit_amount", "next_credit_date", "transaction_fee", "sale_by", "remarks" ];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters");
        }

        const [current_fin_year] = await Promise.all([
            getCurrentFinYear()
        ]);

        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }

        // bill id genration start
        const maxBillId = await getLatestBillIdUsingFinancialYear({ financial_year: current_fin_year[0].year });
        var bill_sl_no = parseInt(maxBillId[0]?.bill_sl_no || 0) + 1;
        const bill_id = generateBillId(current_fin_year[0].year, bill_sl_no);
        // bill id generation end

        /*
        create bill record - all zero
        create finance record - all zero
        create customer credit record
        create customer credit history record
        create notification record
        */

        var isdownpayment = 0;
        const status = 2;
        const { sales_id, purchase_id, sale_quantity, net_total, other_fee, financer_name, next_credit_date, downpayment_amt, location_id, sale_by, remarks, card_no_upi_id, dispersed_amt, total_credit_amt, credit_amount_left, credit_amount_paid, transaction_fee, grand_total_credit_amount, customer_id } = payload;

        var { payment_mode_status } = payload;

        if (credit_amount_paid == "0"){
            payment_mode_status = 0;
        }

        if (parseFloat(credit_amount_paid) > 0){
            isdownpayment = 1;
        }

        payload = {
            ...payload,
            bill_id,
            bill_sl_no,
            grand_total_bill: parseFloat(net_total) + parseFloat(other_fee),
            status: status,
            transaction_fee: 0,
            payment_mode_status: "5",
            cfin_yr: current_fin_year[0].year
        };

        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;``
        delete billPayload.total_credit_amt;
        delete billPayload.financer_name;
        delete billPayload.customer_credit_date;
        delete billPayload.downpayment_amt;
        delete billPayload.other_fee;
        delete billPayload.next_credit_date;
        delete billPayload.sale_by;
        delete billPayload.card_no_upi_id;
        delete billPayload.remarks;
        delete billPayload.dispersed_amt;
        delete billPayload.credit_amount_left;
        delete billPayload.total_credit_amt;
        delete billPayload.credit_amount_paid;
        delete billPayload.grand_total_credit_amount;

        const createBillRes = await createCreditBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));

        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
        }

        const financeBillData = { 
            bill_id: bill_id, 
            financer_name: financer_name,
            payment_mode_status: 6,
            transaction_fee: "0",
            downpayment_amt: downpayment_amt,
            dispersed_amt: dispersed_amt,
            other_fee: other_fee
        };

        const customerCreditData = { 
            bill_id: bill_id, 
            status: 2, 
            total_credit_amt: total_credit_amt, 
            credit_amount_left: credit_amount_left
        };

        const customerCreditHistoryData = { 
            bill_id: bill_id, 
            payment_mode_status: payment_mode_status, 
            card_no_upi_id: card_no_upi_id,
            transaction_fee: transaction_fee,
            total_given: credit_amount_paid, 
            grand_total: grand_total_credit_amount, 
            next_credit_date: next_credit_date,
            updated_by: sale_by,
            isdownpayment: isdownpayment
        };

        const notificationRecordData = {
            bill_id: bill_id,
            notification_type: 2,
            notify_by: sale_by,
            location_id: location_id,
            remarks: remarks,
            status: status
        }

        // 1	Personal discount
        // 2	Personal credit
        // 3	Return bill
        // 4	Extra expense
        // 5	Cash debited
	
        const financeBillRes = await createFinanceBillRecord(Object.keys(financeBillData).toString(), Object.values(financeBillData));
        if (financeBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while finance bill record");
        }

        const customerCreditRes = await createCustomerCredit(Object.keys(customerCreditData).toString(), Object.values(customerCreditData));
        if (customerCreditRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit record");
        }

        const customerCreditHistoryRes = await createCustomerCreditHist(Object.keys(customerCreditHistoryData).toString(), Object.values(customerCreditHistoryData));
        if (customerCreditHistoryRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record");
        }

        // update stock
        const purchasePromises = purchase_id.map((id, index) => {
            const updatePurchaseData = { purchase_id: id, sale_quantity: sale_quantity[index] };
            return updatePurchaseQuantity(updatePurchaseData);
        });

        const purchaseResults = await Promise.all(purchasePromises);
        const failedPurchaseIndex = purchaseResults.findIndex(result => !result.affectedRows);
        if (failedPurchaseIndex !== -1) {
            const failedPurchaseId = purchase_id[failedPurchaseIndex];
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", `Stock exhausted for purchase_id: ${failedPurchaseId}`, { purchase_id: failedPurchaseId });
        }
        
        const notificationBillRes = await createNotificationRecord(Object.keys(notificationRecordData).toString(), Object.values(notificationRecordData));
        if (notificationBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating notification record");
        }

        // update sales
        const data = { 
            bill_no: bill_id, 
            status: status, 
            sales_id 
        };
        const [updateSaleRes] = await Promise.all([
            updateSalesRecordinBill(data)
        ]);

        if (updateSaleRes === "invalid_id") {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Invalid sales ID");
        }
        if (updateSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while updating sales record");
        }

        const billCustomerData = (await searchCustomerUsingID({ customer_id }))[0];
        delete billCustomerData.customer_id;
        delete billCustomerData.inserted_at;
        billCustomerData["bill_id"] = bill_id;

        const keys1 = Object.keys(billCustomerData).toString();
        const values = Object.keys(billCustomerData)
            .map((key) =>
                billCustomerData[key]
            )

        const createBillCustomerRes = await createBillCustomerRecord(keys1, values);


        return ApiResponse.response(resCode.REQUEST_SENT, "success", "Request Sent for admin to approve", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}

module.exports = {
    createBill,
    searchBillUsingCustomerId,
    createCreditBill,
    createFinanceBill,
    createFinanceCreditBill
};