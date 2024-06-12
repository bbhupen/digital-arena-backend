const mariadb = require('mariadb');

const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_DB = process.env.MYSQL_DB;


const pool = mariadb.createPool({
  connectionLimit: 10,
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DB,
});



// Connect and check for errors
pool.getConnection((err, connection) => {
  console.log("Error " + err)

    if(err){
        if (err.code === 'PROTOCOL_CONNECTION_LOST'){
            console.error('Database connection lost');
        }
        if (err.code === 'ER_CON_COUNT_ERROR'){
            console.error('Database has too many connection');
        }
        if (err.code === 'ECONNREFUSED'){
            console.error('Database connection was refused');
        }
    }
    if(connection) connection.release();

    return;
});


module.exports = {
    pool
};