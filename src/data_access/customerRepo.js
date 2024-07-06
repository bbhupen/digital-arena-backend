const { userTableName, customerTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const selectAllCustomers = async () => {
    const customersQuery = `SELECT * FROM ${customerTableName}`;
    const customersResults = await executeQuery(customersQuery);
    return customersResults;
}

const selectLatestCustomerID = async () => {
    const customeridQuery = `SELECT MAX(customer_id) as customer_id FROM ${customerTableName}`;
    const customeridResults = await executeQuery(customeridQuery);
    return customeridResults;
}

const createCutomerRecord = async (keys,data) => {
    const insertQuery = `insert into ${customerTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createCusomterResults = await executeQuery(insertQuery, data);
    return createCusomterResults;
}



// const insertRefreshToken = async (data) => {
//     const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
//     const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
//     return usersResults;
// }

module.exports = {
    selectLatestCustomerID,
    createCutomerRecord
};
