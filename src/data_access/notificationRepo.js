const { notificationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const selectNotificationUsingLocationStatus = async (data) => {
    const notificationQuery = `SELECT * FROM ${notificationTableName} WHERE status = ? and location_id = ?`;
    const notificationResults = await executeQuery(notificationQuery, [data["notification_type"], data["location_id"]]);
    return notificationResults;
}

const selectNotificationRecordUsingNotificationType = async (data) => {
    const notificationQuery = `SELECT * FROM ${notificationTableName} WHERE notification_type = ? and location_id = ?`;
    const notificationResults = await executeQuery(notificationQuery, [data["notification_type"], data["location_id"]]);
    return notificationResults;
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
    selectNotificationUsingLocationStatus,
    createNotificationRecord,
    selectNotificationRecordUsingNotificationType
};
