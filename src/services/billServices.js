
const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { createBillRecord, getLatestBillId, getCurrentFinYear, getBillRecordUsingCustomerID } = require("../data_access/billRepo");
const { updateSalesRecordinBill } = require("../data_access/salesRepo");
const { updatePurchaseQuantity } = require("../data_access/purchaseRepo");
const { updateBillCustomerRecord } = require("../data_access/customerRepo");

const createBill = async (payload) => {
    try {
        const mandateKeys = ["customer_id", "sales_id", "location_id", "payment_mode_status", "transaction_fee", "discount", "net_total", "grand_total_bill"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }

        const maxBillId = await getLatestBillId();
        const bill_id = parseInt(maxBillId[0].bill_id == null ? 0 : maxBillId[0].bill_id) + 1;
        const current_fin_year = await getCurrentFinYear();

        if (!current_fin_year.length){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "record not found")
        }

        if (current_fin_year == "error"){
            return ApiResponse.response(resCode.FAILURE, "failure", "some error occurred")
        }

        payload["bill_id"] = bill_id;
        payload["status"] = "1";
        payload["cfin_yr"] = current_fin_year[0].year;
        const sales_id = payload.sales_id;
        const purchase_id = payload.purchase_id;
        const sale_quantity = payload.sale_quantity;
        const customer_id = payload.customer_id;
        delete payload.sales_id;
        delete payload.purchase_id;
        delete payload.sale_quantity;
        delete payload.customer_id;

        const keys = Object.keys(payload).toString();
        const values = Object.keys(payload)
            .map((key) =>
                payload[key]
            )
        
        //creating bill
        const createBillRes = await createBillRecord(keys, values);

        if (createBillRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        const data = {
            "bill_no": bill_id,
            "status": 1,
            "sales_id": sales_id
        }

        // updating purchase stock
        for (let i = 0; i < purchase_id.length; i++) {
            const updatePurchaseData = {
                purchase_id: purchase_id[i],
                sale_quantity: sale_quantity[i]
            }
            const updatePurchaseRes = await updatePurchaseQuantity(updatePurchaseData);

            if(!updatePurchaseRes.affectedRows){
                return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "stock exhausted",{})
            }

          }

        payload['sales_id'] = sales_id

        // updating sales status
        const updateSaleRes = await updateSalesRecordinBill(data);
        if (updateSaleRes == "invalid_id"){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "invalid sales id")
        }

        if (updateSaleRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        const billCustomerData = {
            "customer_id": customer_id,
            "bill_id": bill_id
        }

        // updating bill customer record
        const res = await updateBillCustomerRecord(billCustomerData);

        console.log(res);

        payload['purchase_id'] = purchase_id;
        payload['sale_quantity'] = sale_quantity;
        payload['customer_id'] = customer_id;
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_inserted", payload);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
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

        if (!res=="error"){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "some unexpected error occurred", []);    
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);   


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}


module.exports = {
    createBill,
    searchBillUsingCustomerId
};