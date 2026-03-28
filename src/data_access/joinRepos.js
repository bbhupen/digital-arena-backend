const { billTableName, saleTableName, returnBillInfoTable } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const getPurchasesFromSalesUsingNotification = async (payload) => {
    const query = `select s.bill_no, s.purchase_id, s.sale_quantity from notification as n, sales as s where n.bill_id = s.bill_no and n.id = ?;`
    const queryRes = await executeQuery(query, [payload["notification_id"]]);
    return queryRes;
}

const getAllPurchaseFromSales = async (payload) => {
    const query = `select s.sales_id, s.bill_no, s.purchase_id, s.sale_quantity from notification as n, sales as s where n.bill_id = s.bill_no and n.id = ?;`
    const queryRes = await executeQuery(query, [payload["notification_id"]]);
    return queryRes;
}

const updateBillRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("status") ? condition += `status="${data["status"]}",` : ``;

    const updateQuery = `UPDATE ${billTableName} SET ${condition.slice(0, -1)} WHERE bill_id="${data["bill_id"]}";`;
    const updateRes = await executeQuery(updateQuery);
    return updateRes;
}

const updateReturnBillRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("status") ? condition += `status="${data["status"]}",` : ``;

    const updateQuery = `UPDATE ${returnBillInfoTable} SET ${condition.slice(0, -1)} WHERE return_bill_id="${data["bill_id"]}";`;
    const updateRes = await executeQuery(updateQuery);
    return updateRes;
}

const updateSalesRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("status") ? condition += `status="${data["status"]}",` : ``;

    const updateQuery = `UPDATE ${saleTableName} SET ${condition.slice(0, -1)} WHERE bill_no="${data["bill_no"]}" and purchase_id="${data["purchase_id"]}";`;
    const updateRes = await executeQuery(updateQuery);
    return updateRes;
}

module.exports = {
    getPurchasesFromSalesUsingNotification,
    updateBillRecord,
    updateSalesRecord,
    getAllPurchaseFromSales,
    updateReturnBillRecord
};
