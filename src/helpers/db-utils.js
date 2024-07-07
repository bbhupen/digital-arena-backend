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

const executeInsertQuery = async (sqlQuery, params = [], tableName = null, primaryKey = 'id') => {
    const connection = await pool.getConnection(); 
    try {
        await connection.beginTransaction(); 

        const res = await connection.query(sqlQuery, params); 

        let insertedRow = null;
        if (tableName && sqlQuery.trim().toLowerCase().startsWith('insert')) {
            const lastInsertIdQuery = `SELECT * FROM ${tableName} WHERE ${primaryKey} = LAST_INSERT_ID()`;
            const [rows] = await connection.query(lastInsertIdQuery);
            insertedRow = rows; 
        }

        await connection.commit(); 
        return insertedRow || res
    } catch (error) {
        await connection.rollback(); 
        console.error('Error executing query:', error);
        return "error";
    } finally {
        connection.release(); 
    }
};

module.exports = {
    executeQuery,
    executeInsertQuery
};
