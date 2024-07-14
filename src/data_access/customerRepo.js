const { customerTableName } = require("../helpers/constant");
const { executeQuery, executeInsertQuery } = require("../helpers/db-utils");

const seachCustomerUsingPhno = async (data) => {
    const customersQuery = `SELECT * FROM ${customerTableName} WHERE phno LIKE ? limit 5`;
    const phnoSearch = `%${data['phno']}%`;
    const customersResults = await executeQuery(customersQuery,[phnoSearch]);
    return customersResults;
}

const selectLatestCustomerID = async () => {
    const customeridQuery = `SELECT MAX(CAST(customer_id AS UNSIGNED)) as customer_id FROM ${customerTableName}`;
    const customeridResults = await executeQuery(customeridQuery);
    return customeridResults;
}

const createCustomerRecord = async (keys,data) => {
    const insertQuery = `insert into ${customerTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createCustomerResult = await executeInsertQuery(insertQuery, data, customerTableName, "customer_id");
    return createCustomerResult;
}



// const insertRefreshToken = async (data) => {
//     const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
//     const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
//     return usersResults;
// }

module.exports = {
    selectLatestCustomerID,
    createCustomerRecord,
    seachCustomerUsingPhno
};
