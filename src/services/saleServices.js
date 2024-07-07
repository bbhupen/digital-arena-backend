const { createSaleRecord } = require("../data_access/salesRepo");
const ApiResponse = require("../helpers/apiresponse");
const { validatePayload } = require("../helpers/utils");

const createSale = async (payload) => {
    const mandateKeys = ["purchase_id", "model", "sale_quantity", "unit_sale_value", "total_sale_value", "sale_by"];
    const validation = await validatePayload(payload, mandateKeys);

    if (!validation.valid) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
    }

    payload["bill_no"] = "NULL";
    payload["status"] = "0";

    const keys = Object.keys(payload).toString();
    const values = Object.keys(payload)
        .map((key) =>
            payload[key]
        )

    const createSaleRes = await createSaleRecord(keys, values);
    
    return ApiResponse.response("success", "record_inserted", createSaleRes);
}


module.exports = {
    createSale
};