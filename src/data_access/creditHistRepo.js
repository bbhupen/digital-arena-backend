const { customerCreditHistTableName } = require("../helpers/constant");
const { executeQuery } = require("../helpers/db-utils");


const getCreditHistDataUsingBill = async (payload) => {
    const query = `select * from ${customerCreditHistTableName} where bill_id = ? order by inserted_date desc limit 1;`
    const queryRes = await executeQuery(query, [payload["bill_id"]]);
    return queryRes;
}


module.exports = {
    getCreditHistDataUsingBill,
};
