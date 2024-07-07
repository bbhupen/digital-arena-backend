const { locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getAllLocationRecord = async () => {
    const locationQuery = `SELECT * from ${locationTableName}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

module.exports = {
    getAllLocationRecord
}