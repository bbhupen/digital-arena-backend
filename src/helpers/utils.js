const moment = require('moment');
const crypto = require('crypto');

const getTimestamp = () => {
    return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
}

const toMD5 = async (password) => {
    return crypto.createHash('md5').update(password).digest('hex');
}

module.exports = {
    getTimestamp,
    toMD5
}