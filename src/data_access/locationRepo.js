const { locationTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");

const getAllLocationRecord = async () => {
    const locationQuery = `SELECT * from ${locationTableName}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

const getLocationById = async (location_id) => {
    const locationQuery = `SELECT * from ${locationTableName} where location_id = ${location_id}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults[0];
}

const getLocationDetails = async (location_id) => {
    const locationQuery = `SELECT * from ${locationTableName} where location_id = ${location_id}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

const addCashToLocation = async (payload) => {
    const locationQuery = `update ${locationTableName} set collectable_cash = collectable_cash + ${payload["cash_amount"]} where location_id = ${payload["location_id"]}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

const subtractCashFromLocation = async (payload) => {
    const locationQuery = `update ${locationTableName} set collectable_cash = collectable_cash - ${payload["cash_amount"]} where location_id = ${payload["location_id"]} and collectable_cash >= ${payload["cash_amount"]}`;
    const locationResults = await executeQuery(locationQuery);
    return locationResults;
}

module.exports = {
    getLocationDetails,
    subtractCashFromLocation,
    getAllLocationRecord,
    addCashToLocation,
    getLocationById
}