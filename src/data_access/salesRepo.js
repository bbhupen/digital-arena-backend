const { userTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getUsers = async () => {
    const users = `SELECT * from ${userTableName}`
    const usersResults = await executeQuery(users);
    return usersResults;
}


module.exports = {
    getUsers
}