const { createSaleRecord, getSaleRecordUsingBillNo } = require("../data_access/salesRepo");
const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");

const createSale = async (payload) => {
    try {
        const mandateKeys = ["purchase_id", "model", "grand_total", "hsn_no", "sale_quantity", "unit_sale_value", "total_sale_value", "sale_by", "gst", "serial_no"];

        if (!payload.length){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }


        for (let i = 0; i < payload.length; i++) {
            const validation = await validatePayload(payload[i], mandateKeys);
            
            payload[i]["bill_no"] = "NULL";
            payload[i]["status"] = "2";

            if (!validation.valid) {
                return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
            }
        }

        const keys = Object.keys(payload[0]).toString();
        const values = payload.map(item => Object.values(item));
        
        const createSaleRes = await createSaleRecord(keys, values);

        if (createSaleRes === "error") {
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record_inserted", createSaleRes);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
    
}

const searchSaleUsingBillNo = async (payload) =>{
    try {
        const mandateKeys = ["bill_no", "start"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        const res = await getSaleRecordUsingBillNo(payload);
    
        if (!res.length){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);    
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);   


    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}


module.exports = {
    createSale,
    searchSaleUsingBillNo
};