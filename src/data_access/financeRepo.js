const { financeBillTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const getFinanceDataUsingBillId = async (payload) => {
    const query = `select * from ${financeBillTableName} where bill_id = ?`
    const queryRes = await executeQuery(query, [payload["bill_id"]]);
    return queryRes;
}


module.exports = {
    getFinanceDataUsingBillId,
};
