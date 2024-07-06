const { purchaseTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getPurchaseByID = async (data) => {
    const purchaseQuery = `SELECT * from ${purchaseTableName} where purchase_id = ? limit 1`;
    const purchaseResults = await executeQuery(purchaseQuery,[data["purchase_id"]]);
    return purchaseResults[0];
}


module.exports = {
    getPurchaseByID
}