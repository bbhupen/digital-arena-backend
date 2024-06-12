const { userTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const selectPasswordUsingUsername = async (data) => {
    const usersQuery = `SELECT password FROM ${userTableName} WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"]]);
    return usersResults;
}

const selectRefreshTokenUsingUsername = async (data) => {
    const usersQuery = `SELECT refreshToken FROM ${userTableName} WHERE username = ? and refreshToken = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"], data["refreshToken"]]);
    return usersResults;
}


const insertRefreshToken = async (data) => {
    const usersQuery = `update ${userTableName} set refreshToken = ? WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
    return usersResults;
}

module.exports = {
    selectPasswordUsingUsername,
    selectRefreshTokenUsingUsername,
    insertRefreshToken
};
