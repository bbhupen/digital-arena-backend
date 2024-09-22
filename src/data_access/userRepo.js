const { userTableName, locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const selectUserUsingUsername = async (data) => {
    const usersQuery = `SELECT * FROM ${userTableName} as u, ${locationTableName} as l WHERE u.location = l.location_id and u.username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"]]);
    return usersResults;
}

const selectRefreshTokenUsingUsernameToken = async (data) => {
    const usersQuery = `SELECT refresh_token FROM ${userTableName} WHERE username = ? and refresh_token = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"], data["refreshToken"]]);
    return usersResults;
}

const selectRefreshTokenUsingUsername = async (data) => {
    const usersQuery = `SELECT refresh_token FROM ${userTableName} WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["username"], data["refreshToken"]]);
    return usersResults;
}


const insertRefreshToken = async (data) => {
    const usersQuery = `update ${userTableName} set refresh_token = ? WHERE username = ?`;
    const usersResults = await executeQuery(usersQuery, [data["refreshToken"], data["username"]]);
    return usersResults;
}

module.exports = {
    selectUserUsingUsername,
    selectRefreshTokenUsingUsernameToken,
    selectRefreshTokenUsingUsername,
    insertRefreshToken
};
