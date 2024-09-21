const { locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getAllLocationRecord = async () => {
    const locationQuery = `SELECT * from ${locationTableName}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

const addCashToLocation = async (payload) => {
    const locationQuery = `update ${locationTableName} set collectable_cash = collectable_cash + ${payload["cash_amount"]} where location_id = ${payload["location_id"]}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

const subtractCashFromLocation = async (payload) => {
    const locationQuery = `update ${locationTableName} set collectable_cash = collectable_cash - ${payload["cash_amount"]} where location_id = ${payload["location_id"]}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

module.exports = {
    subtractCashFromLocation,
    getAllLocationRecord,
    addCashToLocation
}