const { notificationTableName, locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

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
    const notificationQuery = `SELECT l.location_name, n.id, n.bill_id, nt.name, n.remarks, n.notify_by  FROM ${notificationTableName} as n, ${locationTableName} as l, notification_type as nt WHERE n.notification_type = nt.id and n.location_id = l.location_id and n.notification_type = ? and n.status = 2 order by inserted_at desc`;
    const notificationResults = await executeQuery(notificationQuery, [data["notification_type"], data["location_id"]]);
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
    const createRecordResult = await executeQuery(insertQuery, data);
    return createRecordResult;
}
module.exports = {
    selectNotificationRecordUsingId,
    selectNotificationUsingLocationStatus,
    updateNotificationRecord,
    createNotificationRecord,
    selectNotificationRecordUsingNotificationType
};
