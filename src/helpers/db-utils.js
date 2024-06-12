const { pool } = require("../config/dbConfig");

const executeQuery = async (sqlQuery, params = []) => {
    try {
        const res = await pool.query(sqlQuery, params);
        return res;
    } catch (error) {
        console.error('Error executing query:', error);
        return "error";
    }
};

module.exports = {
    executeQuery
};
