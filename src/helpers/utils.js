const moment = require('moment');
const crypto = require('crypto');

const getTimestamp = () => {
    return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
}

const toMD5 = async (password) => {
    return crypto.createHash('md5').update(password).digest('hex');
}

const validatePayload = async (payload, requiredFields) => {
    const hasRequiredFields = requiredFields.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return { valid: false };
    }

    const hasNoBlankFields = requiredFields.every(prop => payload[prop].trim() !== "");
    if (!hasNoBlankFields) {
        return { valid: false };
    }

    return { valid: true };
}

module.exports = {
    getTimestamp,
    toMD5,
    validatePayload
}