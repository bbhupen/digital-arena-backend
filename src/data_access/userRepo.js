const { userTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const selectPasswordUsingUsername = async (data) => {
    const usersQuery = `SELECT password FROM ${userTableName} WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"]]);
    return usersResults;
}

const selectRefreshTokenUsingUsername = async (data) => {
    const usersQuery = `SELECT refresh_token FROM ${userTableName} WHERE username = ? and refresh_token = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"], data["refresh_token"]]);
    return usersResults;
}


const insertRefreshToken = async (data) => {
    const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["refresh_token"], data["username"]]);
    return usersResults;
}

module.exports = {
    selectPasswordUsingUsername,
    selectRefreshTokenUsingUsername,
    insertRefreshToken
};
