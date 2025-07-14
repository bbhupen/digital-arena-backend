const { customerCreditTableName, billCustomerTableName, customerCreditHistTableName, paymentModeStatusTableName, billTableName, locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const getCreditRecords = async (data) => {
    const query = `select bc.bill_id, bc.name, bc.phno, cr.total_credit_amt, credit_amount_left, status from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr where cr.bill_id = bc.bill_id and cr.status = 2 order by bc.inserted_at desc limit ${data["start"]},${data["limit"]};`
    const queryRes = await executeQuery(query);
    return queryRes;
}

const getCreditRecordsUsingPhoneNumber = async (data) => {
    const query = `select bc.bill_id, bc.name, bc.phno, cr.total_credit_amt, credit_amount_left, status from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr where cr.bill_id = bc.bill_id and cr.status = 2 and bc.phno = ? order by bc.inserted_at desc limit ${data["start"]},${data["limit"]};`
    const queryRes = await executeQuery(query, [data["phone_number"]]);
    return queryRes;
}

const getTotalCreditRecords = async() => {
    const query = `select count(*) as totalCount from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr where cr.bill_id = bc.bill_id and cr.status = 2 order by bc.inserted_at desc;`
    const queryRes = await executeQuery(query);
    return queryRes;
}

const getCreditRecordsUsingBillId = async (payload) => {
    const query = `select l.location_name, b.location_id, bc.bill_id, bc.name, bc.phno, cr.total_credit_amt, credit_amount_left, cr.status from ${billCustomerTableName} as bc, ${customerCreditTableName} as cr, ${billTableName} as b, ${locationTableName} as l where b.location_id = l.location_id and cr.bill_id = bc.bill_id and b.bill_id = cr.bill_id and cr.bill_id = ? order by bc.inserted_at desc;`
    const queryRes = await executeQuery(query, payload["bill_id"]);
    return queryRes;
}

const getCreditHistDataUsingBillID = async (payload) => {
    const query = `select cch.cus_credit_rec_hist_id, cch.bill_id, cch.transaction_fee, cch.card_no_upi_id, cch.total_given, cch.grand_total, cch.next_credit_date, cch.isdownpayment, cch.updated_by, pms.payment_mode_name as payment_mode_status, cch.inserted_date from ${customerCreditHistTableName} as cch, ${paymentModeStatusTableName} as pms where cch.payment_mode_status = pms.payment_mode_id and cch.bill_id = ? order by inserted_date desc;`
    const queryRes = await executeQuery(query, [payload["bill_id"]]);
    return queryRes;
}

const updateCreditRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("credit_amount_left") ? condition += `credit_amount_left="${data["credit_amount_left"]}",` : ``;
    data.hasOwnProperty("status") ? condition += `status="${data["status"]}",` : ``;

    const updateQuery = `UPDATE ${customerCreditTableName} SET ${condition.slice(0, -1)} WHERE bill_id="${data["bill_id"]}";`;
    const updateRes = await executeQuery(updateQuery);
    return updateRes;
}

const updateCreditStatusRecord = async (data) => {
    const query = `update ${customerCreditTableName} set status = ? where bill_id = ?`;
    const queryRes = await executeQuery(query, [data["status"], data["bill_id"]]);
    return queryRes;
}

module.exports = {
    getCreditRecords,
    getCreditRecordsUsingBillId,
    getCreditHistDataUsingBillID,
    updateCreditRecord,
    getTotalCreditRecords,
    updateCreditStatusRecord,
    getCreditRecordsUsingPhoneNumber
};
