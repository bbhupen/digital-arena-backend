const ApiResponse = require("../helpers/apiresponse");
const { createCustomerRecord, selectLatestCustomerID, seachCustomerUsingPhno } = require("../data_access/customerRepo");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");

const createCustomer = async (payload) => {
    try {
        const mandateKeys = ["name", "phno", "address", "city", "district", "state", "pincode"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }

        const maxCustomerId = await selectLatestCustomerID();
        const customer_id = parseInt(maxCustomerId[0].customer_id == null ? 0 : maxCustomerId[0].customer_id) + 1
        payload["customer_id"] = customer_id

        const keys = Object.keys(payload).toString();
        
        const values = Object.keys(payload)
            .map((key) =>
                payload[key]
            )

        const createCustomerRes = await createCustomerRecord(keys, values);
        
        if (createCustomerRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }
        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record created", {customer_id: customer_id});
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");
    }
}

const searchCustomer = async (payload) => {
    try {
        const mandateKeys = ["phno"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }
    
        const res = await seachCustomerUsingPhno(payload);
    
        if (!res.length){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found");    
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");       
    }

}


module.exports = {
    createCustomer,
    searchCustomer
};