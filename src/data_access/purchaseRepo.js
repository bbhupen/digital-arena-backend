const { purchaseTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getPurchaseByID = async (data) => {
    const purchaseQuery = `SELECT * from ${purchaseTableName} where purchase_id = ? limit 1`;
    const purchaseResults = await executeQuery(purchaseQuery,[data["purchase_id"]]);
    return purchaseResults[0];
}

const updatePurchaseLocationID = async (data) => {
    const updatePurchaseQuery = `UPDATE ${purchaseTableName} SET location=? WHERE purchase_id=?;`;
    const updatePurchaseRes = await executeQuery(updatePurchaseQuery, [data["location_id"], data["purchase_id"]]);
    return updatePurchaseRes;
}

const updatePurchasePhysicallyVerified = async (data) => {
    const updatePurchaseQuery = `UPDATE ${purchaseTableName} SET physically_verified_status=1 WHERE purchase_id=?;`;
    const updatePurchaseRes = await executeQuery(updatePurchaseQuery, [data["purchase_id"]]);
    return updatePurchaseRes;
}

const updatePurchaseQuantity = async (data) => {
    let condition = ``;

    data.hasOwnProperty("sale_quantity") ? condition += `total_quantity_left= total_quantity_left - ${data["sale_quantity"]},` : ``;

    const purchaseUpdateQuery = `UPDATE ${purchaseTableName} SET ${condition.slice(0, -1)} WHERE purchase_id="${data["purchase_id"]}" AND total_quantity_left >= ${data["sale_quantity"]};`;
    const purchaseUpdateRes = await executeQuery(purchaseUpdateQuery);
    purchaseUpdateRes["purchase_id"] = data["purchase_id"];
    return purchaseUpdateRes;

}


const addPurchaseQuantity = async (data) => {
    let condition = ``;

    data.hasOwnProperty("sale_quantity") ? condition += `total_quantity_left= total_quantity_left + ${data["sale_quantity"]},` : ``;

    const purchaseUpdateQuery = `UPDATE ${purchaseTableName} SET ${condition.slice(0, -1)} WHERE purchase_id="${data["purchase_id"]}" AND total_quantity_left >= ${data["sale_quantity"]};`;
    const purchaseUpdateRes = await executeQuery(purchaseUpdateQuery);
    purchaseUpdateRes["purchase_id"] = data["purchase_id"];
    return purchaseUpdateRes;

}

module.exports = {
    getPurchaseByID,
    updatePurchaseQuantity,
    updatePurchasePhysicallyVerified,
    addPurchaseQuantity,
    updatePurchaseLocationID
}