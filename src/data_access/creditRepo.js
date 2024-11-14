const { customerCreditTableName, billCustomerTableName, customerCreditHistTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const getCreditRecords = async (data) => {
    const query = `select bc.bill_id, bc.name, bc.phno, cr.total_credit_amt, credit_amount_left, status from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr where cr.bill_id = bc.bill_id order by bc.inserted_at desc limit ${data["start"]},10;`
    const queryRes = await executeQuery(query);
    return queryRes;
}

const getCreditRecordsUsingBillId = async (payload) => {
    const query = `select bc.bill_id, bc.name, bc.phno, cr.total_credit_amt, credit_amount_left, status from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr where cr.bill_id = bc.bill_id and cr.bill_id = ? order by bc.inserted_at desc;`
    const queryRes = await executeQuery(query, payload["bill_id"]);
    return queryRes;
}

const getCreditHistDataUsingBillID = async (payload) => {
    const query = `select * from ${customerCreditHistTableName} where bill_id = ? order by inserted_date desc limit 1;`
    const queryRes = await executeQuery(query, [payload["bill_id"]]);
    return queryRes;
}

const updateCreditRecord = async (data) => {
    const query = `update ${customerCreditTableName} set credit_amount_left = ? where bill_id = ?`;
    const queryRes = await executeQuery(query, [data["credit_amount_left"], data["bill_id"]]);
    return queryRes;
}

module.exports = {
    getCreditRecords,
    getCreditRecordsUsingBillId,
    getCreditHistDataUsingBillID,
    updateCreditRecord
};
