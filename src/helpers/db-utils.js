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

const executeInsertQuery = (query) => {
    return new Promise((resolve, reject) => {
        try{
            dbConnection.query(query, function (err, result) {
                if (err){
                    reject(err)
                    return "error"
                }
                resolve(result);
            });
        }
        catch(e){
            reject(e)
            return "error"
        }
    })
}

module.exports = {
    executeQuery,
    executeInsertQuery
};
