const { notificationTableName, locationTableName, expenditureTableName, billTableName, saleTableName } = require("../helpers/constant");
const { executeQuery, executeInsertQuery } = require("../helpers/db-utils");

const selectNotificationRecordUsingId = async (data) => {
    const notificationQuery = `SELECT * FROM ${notificationTableName} WHERE id = ?`;
    const notificationResults = await executeQuery(notificationQuery, [data["id"]]);
    return notificationResults;
}

const selectNotificationUsingLocationStatus = async (data) => {
    const notificationQuery = `SELECT * FROM ${notificationTableName} WHERE status = ? and location_id = ?`;
    const notificationResults = await executeQuery(notificationQuery, [data["notification_type"], data["location_id"]]);
    return notificationResults;
}

const selectNotificationRecordUsingNotificationType = async (data) => {
    
    const notificationQuery = `SELECT l.location_name,n.id AS id,n.bill_id,nt.name AS name,n.remarks,n.notify_by,b.net_total,b.grand_total_bill,GROUP_CONCAT(s.model ORDER BY s.sales_id SEPARATOR ', ') AS sale_products,GROUP_CONCAT(s.sale_quantity ORDER BY s.sales_id SEPARATOR ', ') AS sale_quantities,GROUP_CONCAT(s.total_sale_value ORDER BY s.sales_id SEPARATOR ', ') AS sale_amounts,COALESCE(SUM(s.total_sale_value),0) AS sale_grand_total FROM ${notificationTableName} n INNER JOIN ${locationTableName} l ON n.location_id=l.location_id INNER JOIN notification_type nt ON n.notification_type=nt.id INNER JOIN ${billTableName} b ON b.bill_id=n.bill_id LEFT JOIN ${saleTableName} s ON s.bill_no=b.bill_id AND s.status=1 WHERE n.notification_type=? AND n.status=2 GROUP BY n.id,n.bill_id,l.location_name,nt.name,n.remarks,n.notify_by,b.net_total,b.grand_total_bill ORDER BY n.inserted_at DESC`;

    const notificationResults = await executeQuery(notificationQuery, [data["notification_type"], data["location_id"]]);
    console.log(notificationResults)
    return notificationResults; 
}

const updateNotificationRecord = async (data) => {
    let condition = ``;
    data.hasOwnProperty("status") ? condition += `status="${data["status"]}",` : ``;
    const updateQuery = `UPDATE ${notificationTableName} SET ${condition.slice(0, -1)} WHERE id="${data["id"]}";`;
    const updateRes = await executeQuery(updateQuery);
    return updateRes;
}

const createNotificationRecord = async(keys,data) => {
    let valuesPlaceholder = "";
    for (let i = 0; i < data.length; i++) {
        valuesPlaceholder += "?,";
    }
    valuesPlaceholder = valuesPlaceholder.slice(0, -1);

    const insertQuery = `insert into ${notificationTableName} (${keys}) values(${valuesPlaceholder})`;
    const createRecordResult = await executeInsertQuery(insertQuery, data, "notification", "id");
    return createRecordResult;
}

const selectExpenditureRecordUsingNotificationId = async (data) => {
    const query = `SELECT * FROM ${expenditureTableName} WHERE notification_id = ?`;
    const queryRes = await executeQuery(query, [data["notification_id"]]);
    return queryRes;
}

const createExpenditureInNotification = async (keys,data) => {
    let valuesPlaceholder = "";
    for (let i = 0; i < data.length; i++) {
        valuesPlaceholder += "?,";
    }
    valuesPlaceholder = valuesPlaceholder.slice(0, -1);

    const insertQuery = `insert into ${expenditureTableName} (${keys}) values(${valuesPlaceholder})`;
    const createRecordResult = await executeInsertQuery(insertQuery, data, "notification", "id");
    return createRecordResult;
}

module.exports = {
    selectNotificationRecordUsingId,
    selectNotificationUsingLocationStatus,
    updateNotificationRecord,
    createNotificationRecord,
    selectNotificationRecordUsingNotificationType,
    createExpenditureInNotification,
    selectExpenditureRecordUsingNotificationId
};
