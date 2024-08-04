const { customerTableName, billCustomerTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const searchCustomerRecordPagination = async (data) => {
    const customersQuery = `SELECT * FROM ${customerTableName} WHERE phno like ? or name like ? limit ${data["start"]},10`;
    const field = `%${data['field']}%`;
    const customersResults = await executeQuery(customersQuery,[field, field]);
    return customersResults;
}

const searchCustomerUsingPhno = async (data) => {
    const customersQuery = `SELECT * FROM ${customerTableName} WHERE phno LIKE ? limit 5`;
    const phnoSearch = `%${data['phno']}%`;
    const customersResults = await executeQuery(customersQuery,[phnoSearch]);
    return customersResults;
}

const selectCustomerUsingPhno = async (phno) => {
    const customersQuery = `SELECT * FROM ${customerTableName} WHERE phno = ? `;
    const customersResults = await executeQuery(customersQuery,[phno]);
    return customersResults;
}

const selectLatestCustomerID = async () => {
    const customeridQuery = `SELECT MAX(CAST(customer_id AS UNSIGNED)) as customer_id FROM ${customerTableName}`;
    const customeridResults = await executeQuery(customeridQuery);
    return customeridResults;
}

const createCustomerRecord = async (keys,data) => {
    const insertQuery = `insert into ${customerTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createCustomerResult = await executeQuery(insertQuery, data);
    return createCustomerResult;
}

const createBillCustomerRecord = async (keys,data) => {
    const insertQuery = `insert into ${billCustomerTableName} (${keys}) values(?,?,?,?,?,?,?,?)`;
    const createBillCustomerResult = await executeQuery(insertQuery, data);
    return createBillCustomerResult;
}

const updateBillCustomerRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("bill_id") ? condition += `bill_id="${data["bill_id"]}",` : ``;

    const updateCustomerQuery = `UPDATE ${billCustomerTableName} SET ${condition.slice(0, -1)} WHERE bill_id="${data["customer_id"]}";`;
    const updateCustomerRes = await executeQuery(updateCustomerQuery);
    return updateCustomerRes;
}

const updateCustomerRecord = async (data) => {
    let condition = ``;

    data.hasOwnProperty("name") ? condition += `name="${data["name"]}",` : ``;
    data.hasOwnProperty("phno") ? condition += `phno="${data["phno"]}",` : ``;
    data.hasOwnProperty("address") ? condition += `address="${data["address"]}",` : ``;
    data.hasOwnProperty("city") ? condition += `city="${data["city"]}",` : ``;
    data.hasOwnProperty("district") ? condition += `district="${data["district"]}",` : ``;
    data.hasOwnProperty("state") ? condition += `state="${data["state"]}",` : ``;
    data.hasOwnProperty("pincode") ? condition += `pincode="${data["pincode"]}",` : ``;

    const updateCustomerQuery = `UPDATE ${customerTableName} SET ${condition.slice(0, -1)} WHERE customer_id="${data["customer_id"]}";`;
    const updateCustomerRes = await executeQuery(updateCustomerQuery);
    return updateCustomerRes;

}

// const insertRefreshToken = async (data) => {
//     const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
//     const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
//     return usersResults;
// }

module.exports = {
    searchCustomerRecordPagination,
    selectLatestCustomerID,
    createCustomerRecord,
    searchCustomerUsingPhno,
    selectCustomerUsingPhno,
    updateCustomerRecord,
    createBillCustomerRecord,
    updateBillCustomerRecord
};
