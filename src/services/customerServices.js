const ApiResponse = require("../helpers/apiresponse");
const { createCutomerRecord, selectLatestCustomerID } = require("../data_access/customerRepo");
const { validatePayload } = require("../helpers/utils");

const createCustomer = async (payload) => {
    const mandateKeys = ["name", "phno", "address", "city", "district", "state", "pincode"];
    const validation = await validatePayload(payload, mandateKeys);

    if (!validation.valid) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
    }

    const maxCustomerId = await selectLatestCustomerID();
    const customer_id = parseInt(maxCustomerId[0].customer_id) + 1
    payload["customer_id"] = customer_id

    const keys = Object.keys(payload).toString();
    
    const values = Object.keys(payload)
        .map((key) =>
            payload[key]
        )

    const createCustomerRes = await createCutomerRecord(keys, values);
    
    if (createCustomerRes == "error"){
        return ApiResponse.response("failure", "some error occurred");
    }
    
    return ApiResponse.response("success", "record_inserted", {});
}


module.exports = {
    createCustomer
};