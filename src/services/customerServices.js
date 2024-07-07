const ApiResponse = require("../helpers/apiresponse");
const { createCustomerRecord, selectLatestCustomerID, seachCustomerUsingPhno } = require("../data_access/customerRepo");
const { validatePayload } = require("../helpers/utils");

const createCustomer = async (payload) => {
    const mandateKeys = ["name", "phno", "address", "city", "district", "state", "pincode"];
    const validation = await validatePayload(payload, mandateKeys);

    if (!validation.valid) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
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
        return ApiResponse.response("failure", "some error occurred");
    }
    
    return ApiResponse.response("success", "record_inserted", {customer_id: customer_id});
}

const searchCustomer = async (payload) => {
    const mandateKeys = ["phno"];
    const validation = await validatePayload(payload, mandateKeys);

    if (!validation.valid){
        return ApiResponse.response("failure", "req.body does not have valid parameters");
    }

    const res = await seachCustomerUsingPhno(payload);

    if (!res.length){
        return ApiResponse.response("success", "no_record_found");    
    }

    return ApiResponse.response("success", "record_found", res);
}


module.exports = {
    createCustomer,
    searchCustomer
};