const { saleTableName } = require("../helpers/constant");
const { executeInsertQuery, executeQuery } = require("../helpers/db-utils");

const createSaleRecord = async (keys,data) => {
    const insertQuery = `insert into ${saleTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createCusomterResults = await executeInsertQuery(insertQuery, data, saleTableName, "sales_id");
    return createCusomterResults;
}

const updateSalesRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("bill_no") ? condition += `bill_no="${data["bill_no"]}",` : ``;
    data.hasOwnProperty("status") ? condition += `status=${data["status"]},` : ``;

    const updateSalesQuery = `UPDATE ${saleTableName} SET ${condition.slice(0, -1)} WHERE sales_id="${data["sales_id"]}";`;
    const updateSalesResult = await executeQuery(updateSalesQuery);

    return updateSalesResult;

}


module.exports = {
    createSaleRecord,
    updateSalesRecord
}