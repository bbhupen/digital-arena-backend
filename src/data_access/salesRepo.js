const { saleTableName } = require("../helpers/constant");
const { executeBulkInsertQuery, executeBulkUpdateQuery, executeQuery } = require("../helpers/db-utils");

const createSaleRecord = async (keys,data) => {
    const insertQuery = `insert into ${saleTableName} (${keys}) values(?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const createCusomterResults = await executeBulkInsertQuery(insertQuery, data, saleTableName, "sales_id");
    return createCusomterResults;
}

// const updateSalesRecord = async (data) => {
//     let condition = ``;

//     data.hasOwnProperty("bill_no") ? condition += `bill_no="${data["bill_no"]}",` : ``;
//     data.hasOwnProperty("status") ? condition += `status=${data["status"]},` : ``;

//     const updateSalesQuery = `UPDATE ${saleTableName} SET ${condition.slice(0, -1)} WHERE sales_id="${data["sales_id"]}";`;
//     const updateSalesResult = await executeQuery(updateSalesQuery);

//     return updateSalesResult;

// }

const getSaleRecordUsingBillNo = async (payload) => {
    const saleRecordQuery = `SELECT * FROM ${saleTableName} where bill_no = ? order by inserted_at desc limit ${payload["start"]},10;`;
    const saleRecordResults = await executeQuery(saleRecordQuery,[payload["bill_no"]]);
    return saleRecordResults;
}


const updateSalesRecordinBill = async (data) => {

    const updateSalesQuery = `UPDATE ${saleTableName} SET bill_no = "${data["bill_no"]}", status = "${data["status"]}" WHERE sales_id=?;`;
    const updateSalesResult = await executeBulkUpdateQuery(updateSalesQuery, data['sales_id']);
    return updateSalesResult;

}

module.exports = {
    createSaleRecord,
    getSaleRecordUsingBillNo,
    updateSalesRecordinBill
}