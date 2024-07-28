const { purchaseTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getPurchaseByID = async (data) => {
    const purchaseQuery = `SELECT * from ${purchaseTableName} where purchase_id = ? limit 1`;
    const purchaseResults = await executeQuery(purchaseQuery,[data["purchase_id"]]);
    return purchaseResults[0];
}

const updatePurchasePhysicallyVerified = async (data) => {
    const updatePurchaseQuery = `UPDATE ${purchaseTableName} SET physically_verified_status=1 WHERE purchase_id=?;`;
    const updatePurchaseRes = await executeQuery(updatePurchaseQuery, [data["purchase_id"]]);
    return updatePurchaseRes;
}


module.exports = {
    getPurchaseByID,
    updatePurchasePhysicallyVerified
}