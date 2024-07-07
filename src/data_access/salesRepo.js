const { saleTableName } = require("../helpers/constant");
const { executeInsertQuery } = require("../helpers/db-utils");

const createSaleRecord = async (keys,data) => {
    const insertQuery = `insert into ${saleTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createCusomterResults = await executeInsertQuery(insertQuery, data, saleTableName, "sales_id");
    return createCusomterResults;
}


module.exports = {
    createSaleRecord,
}