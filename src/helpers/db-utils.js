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


const executeBulkUpdateQuery = async (sqlQuery, values) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        var res = "";
        await Promise.all(values.map(async (value) => {
            const createRecordRes = await executeQuery(sqlQuery, value);
            if (createRecordRes === "error") {
                res = "error"
                return
            }

            if (!createRecordRes['affectedRows']>0)
            {
                res = "invalid_id"
                return
            }
        }));
        await connection.commit();

        return res;

    } catch (error) {
        await connection.rollback();
        console.error('Error executing query:', error);
        return "error";
    } finally {
        connection.release();
    }
};

const executeBulkInsertQuery = async (sqlQuery, values, tableName = null, primaryKey = 'id') => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const res = await Promise.all(values.map(async (value) => {
            const createRecordRes = await executeInsertQuery(sqlQuery, value, tableName, primaryKey);
            if (createRecordRes === "error") {
                throw new Error("some error occurred");
            }
            return createRecordRes;
        }));

        await connection.commit();
        return res

    } catch (error) {
        await connection.rollback();
        console.error('Error executing query:', error);
        return "error";
    } finally {
        connection.release();
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
    executeInsertQuery,
    executeBulkInsertQuery,
    executeBulkUpdateQuery
};
