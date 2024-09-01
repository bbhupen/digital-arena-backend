const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { createBillRecord, getLatestBillId, getCurrentFinYear, getBillRecordUsingCustomerID, createCreditBillRecord, createCustomerCredit, createCustomerCreditHist } = require("../data_access/billRepo");
const { updateSalesRecordinBill } = require("../data_access/salesRepo");
const { updatePurchaseQuantity } = require("../data_access/purchaseRepo");
const { updateBillCustomerRecord } = require("../data_access/customerRepo");

const createBill = async (payload) => {
    try {
        // Validate payload
        const mandateKeys = ["customer_id", "sales_id", "location_id", "card_no_upi_id", "payment_mode_status", "transaction_fee", "discount", "net_total", "grand_total_bill"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "Invalid parameters in request body");
        }

        // Get the latest bill ID
        const maxBillId = await getLatestBillId();
        const bill_id = parseInt(maxBillId[0]?.bill_id || 0) + 1;
        const current_fin_year = await getCurrentFinYear();

        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }

        payload = {
            ...payload,
            bill_id,
            status: "1",
            cfin_yr: current_fin_year[0].year
        };

        const { sales_id, purchase_id, sale_quantity, customer_id } = payload;

        // Remove unnecessary keys for the bill creation
        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;

        // Create bill
        const createBillRes = await createBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));

        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
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

        // Update bill customer record
        const billCustomerData = { customer_id, bill_id };
        const updateCustomerRes = await updateBillCustomerRecord(billCustomerData);
        console.log(updateCustomerRes);

        // Return successful response
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
        const mandateKeys = ["customer_id", "purchase_id", "sales_id", "location_id", "card_no_upi_id", "transaction_fee", "discount", "net_total", "grand_total_bill", "total_credit_amt", "credit_amount_left", "customer_credit_date", "grand_total_credit_amount" ];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "Invalid parameters in request body");
        }

        const [maxBillId, current_fin_year] = await Promise.all([
            getLatestBillId(),
            getCurrentFinYear()
        ]);

        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }

        const bill_id = parseInt(maxBillId[0]?.bill_id || 0) + 1;
        const { sales_id, purchase_id, sale_quantity, customer_id, credit_amount_left, credit_amount_paid, customer_credit_date, transaction_fee, card_no_upi_id, grand_total_bill, grand_total_credit_amount } = payload;
        delete payload.transaction_fee;

        payload = {
            ...payload,
            bill_id,
            status: "1",
            transaction_fee: 0,
            payment_mode_status: "6",
            cfin_yr: current_fin_year[0].year
        };

        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;
        delete billPayload.discount;
        delete billPayload.card_no_upi_id;
        delete billPayload.total_credit_amt;
        delete billPayload.credit_amount_left;
        delete billPayload.customer_credit_date;
        delete billPayload.credit_amount_paid;
        delete billPayload.grand_total_credit_amount;

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
            payment_mode_status: 6, 
            card_no_upi_id: card_no_upi_id,
            transaction_fee: transaction_fee, 
            total_given: credit_amount_paid, 
            grand_total: grand_total_credit_amount, 
            next_credit_date: customer_credit_date,
            isdownpayment: 0 
        };

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

        const data = { bill_no: bill_id, status: 1, sales_id };
        const [updateSaleRes, updateCustomerRes] = await Promise.all([
            updateSalesRecordinBill(data),
            updateBillCustomerRecord({ customer_id, bill_id })
        ]);

        if (updateSaleRes === "invalid_id") {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Invalid sales ID");
        }
        if (updateSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while updating sales record");
        }

        return ApiResponse.response(resCode.RECORD_CREATED, "success", "Record inserted", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}


const createFinanceBill = async (payload) => {
    try {
        // Validate payload
        const mandateKeys = ["customer_id", "sales_id", "location_id", "transaction_fee", "discount", "net_total", "grand_total_bill", "hypo_by" ];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "Invalid parameters in request body");
        }

        // Get the latest bill ID
        const maxBillId = await getLatestBillId();
        const bill_id = parseInt(maxBillId[0]?.bill_id || 0) + 1;
        const current_fin_year = await getCurrentFinYear();

        if (!current_fin_year.length) {
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "Financial year record not found");
        }

        payload = {
            ...payload,
            bill_id,
            status: "1",
            payment_mode_status: "5",
            cfin_yr: current_fin_year[0].year
        };

        const { sales_id, purchase_id, sale_quantity, customer_id } = payload;

        // Remove unnecessary keys for the bill creation
        const billPayload = { ...payload };
        delete billPayload.sales_id;
        delete billPayload.purchase_id;
        delete billPayload.sale_quantity;
        delete billPayload.customer_id;
        delete billPayload.discount;
        delete billPayload.transaction_fee;

        console.log(billPayload)

        // Create bill
        const createBillRes = await createCreditBillRecord(Object.keys(billPayload).toString(), Object.values(billPayload));

        if (createBillRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating bill");
        }

        const customerCreditData = { 
            bill_id: bill_id, 
            status: 2, 
            total_credit_amt: 4, 
            credit_amount_left: 2 
        };

        const customerCreditHistoryData = { 
            bill_id: bill_id, 
            payment_mode_status: 6, 
            transaction_fee: 0, 
            total_given: 100, 
            grand_total: 10, 
            next_credit_date: 1,
            isdownpayment: 0 
        };

        const createCustomerCreditRes = await createCustomerCredit(Object.keys(customerCreditData).toString(), Object.values(customerCreditData));

        if (createCustomerCreditRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record");
        }


        const createCustomerCreditHistoryRes = await createCustomerCreditHist(Object.keys(customerCreditHistoryData).toString(), Object.values(customerCreditHistoryData));

        if (createCustomerCreditHistoryRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "Error occurred while creating customer credit history record");
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

        /*
            create customer credit record

            create customer credit history record

            update purchase stock

            update sales record

            update bill_customer record

        */

        // Update bill customer record
        const billCustomerData = { customer_id, bill_id };
        const updateCustomerRes = await updateBillCustomerRecord(billCustomerData);

        // Return successful response
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "Record inserted", payload);

    } catch (error) {
        console.error("Error in createBill:", error);
        return ApiResponse.response(resCode.FAILED, "failure", "Unexpected error occurred");
    }
}


module.exports = {
    createBill,
    searchBillUsingCustomerId,
    createCreditBill,
    createFinanceBill
};