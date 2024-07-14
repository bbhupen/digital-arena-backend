const { createSaleRecord } = require("../data_access/salesRepo");
const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");

const createSale = async (payload) => {
    try {
        const mandateKeys = ["purchase_id", "model", "grand_total", "sale_quantity", "unit_sale_value", "total_sale_value", "sale_by", "gst", "serial_no"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }
    
        payload["bill_no"] = "NULL";
        payload["status"] = "2";
    
        const keys = Object.keys(payload).toString();
        const values = Object.keys(payload)
            .map((key) =>
                payload[key]
            )
    
        const createSaleRes = await createSaleRecord(keys, values);

        if (createSaleRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_inserted", createSaleRes);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
    
}


module.exports = {
    createSale
};