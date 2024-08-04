const ApiResponse = require("../helpers/apiresponse");
const { createCustomerRecord, selectLatestCustomerID, searchCustomerUsingPhno, selectCustomerUsingPhno, updateCustomerRecord, searchCustomerRecordPagination, createBillCustomerRecord } = require("../data_access/customerRepo");
const { validatePayload } = require("../helpers/utils");
const resCode = require("../helpers/responseCodes");

const createCustomer = async (payload) => {
    try {
        const mandateKeys = ["name", "phno", "address", "city", "district", "state", "pincode"];
        const validation = await validatePayload(payload, mandateKeys);

        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }

        const customerExists = await selectCustomerUsingPhno(payload['phno']);
        var isChanges = false;

        if (customerExists.length){ 
            payload['customer_id'] = customerExists[0]['customer_id']
            

            if (payload['shouldUpdate']){
                const updateCustomerRes = await updateCustomerRecord(payload);

                if (updateCustomerRes == 'error'){
                    return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
                }

                return ApiResponse.response(resCode.RECORD_UPDATED, "success", "record updated", payload);
            }

            for (let field of mandateKeys) {
                if (field == "phno") continue;
                if (field == "shouldUpdate") continue;
                if (payload[field] !== customerExists[0][field]) { 
                    isChanges = true; 
                    break;
                }
            }

            if (isChanges){
                return ApiResponse.response(resCode.RECORD_MODIFIED, "success", "field modified", payload)
            }

            
            return ApiResponse.response(resCode.RECORD_ALREADY_EXISTS, "success", "record already exists", payload) 
        }

        delete payload.shouldUpdate;
        const maxCustomerId = await selectLatestCustomerID();
        const customer_id = parseInt(maxCustomerId[0].customer_id == null ? 0 : maxCustomerId[0].customer_id) + 1
        payload["customer_id"] = customer_id

        const keys = Object.keys(payload).toString();
        if (payload.hasOwnProperty('customer_id')) {
            payload.bill_id = payload.customer_id;
            delete payload.customer_id;
          }
        const keys1 = Object.keys(payload).toString();
        
        const values = Object.keys(payload)
            .map((key) =>
                payload[key]
            )

        const createCustomerRes = await createCustomerRecord(keys, values);
        createBillCustomerRecord(keys1,values);
        
        if (createCustomerRes == "error"){
            return ApiResponse.response(resCode.RECORD_NOT_CREATED, "failure", "some error occurred")
        }

        
        return ApiResponse.response(resCode.RECORD_CREATED, "success", "record created", payload);
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
    
        const res = await searchCustomerUsingPhno(payload);
    
        if (!res.length){
            return ApiResponse.response(resCode.RECORD_NOT_FOUND, "success", "no_record_found", []);
        }
    
        return ApiResponse.response(resCode.RECORD_FOUND, "success", "record_found", res);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILED, "failure", "some unexpected error occurred");       
    }

}

const searchCustomerWithPagination = async (payload) => {
    try {
        const mandateKeys = ["field", "start", "search_all"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid){
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters",[])
        }

        if (payload['search_all']){
            payload["field"] = "";
        }
    
        const res = await searchCustomerRecordPagination(payload);
    
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
    createCustomer,
    searchCustomer,
    searchCustomerWithPagination
};