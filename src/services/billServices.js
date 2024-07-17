
const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");
const { createBillRecord, getLatestBillId, getCurrentFinYear } = require("../data_access/billRepo");
const { updateSalesRecordinBill } = require("../data_access/salesRepo");

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
        delete payload.sales_id;

        const keys = Object.keys(payload).toString();
        const values = Object.keys(payload)
            .map((key) =>
                payload[key]
            )
    
        const createBillRes = await createBillRecord(keys, values);

        if (createBillRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        const data = {
            "bill_no": bill_id,
            "status": 1,
            "sales_id": sales_id
        }

        payload['sales_id'] = sales_id
        const updateSaleRes = await updateSalesRecordinBill(data);
        if (updateSaleRes == "invalid_id"){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "failure", "invalid sales id")
        }

        if (updateSaleRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_inserted", payload);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
    
}


module.exports = {
    createBill
};