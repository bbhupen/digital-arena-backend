const { billTableName, finYearTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getLatestBillId = async () => {
    const billIDQuery = `SELECT MAX(CAST(bill_id AS UNSIGNED)) AS bill_id FROM ${billTableName};`;
    const billIDResults = await executeQuery(billIDQuery);
    return billIDResults;
}

const getBillRecordUsingCustomerID = async (payload) => {
    const billRecordQuery = `SELECT * FROM ${billTableName} where customer_id = ? order by inserted_at desc limit ${payload["start"]},10;`;
    const billRecordResults = await executeQuery(billRecordQuery,[payload["customer_id"]]);
    return billRecordResults;
}

const getCurrentFinYear = async () => {
    const currentFinYearQuery = `select year from ${finYearTableName} limit 1`;
    const currentFinYearResult = await executeQuery(currentFinYearQuery);
    return currentFinYearResult;
}

const createBillRecord = async (keys,data) => { 
    const insertQuery = `insert into ${billTableName} (${keys}) values(?,?,?,?,?,?,?,?,?,?)`;
    const createBillResult = await executeQuery(insertQuery, data);
    return createBillResult;
}



// const insertRefreshToken = async (data) => {
//     const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
//     const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
//     return usersResults;
// }

module.exports = {
    getLatestBillId,
    getBillRecordUsingCustomerID,
    getCurrentFinYear,
    createBillRecord
};
