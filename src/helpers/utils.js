const moment = require('moment');
const crypto = require('crypto');

const getTimestamp = () => {
    return moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
}

const toMD5 = async (password) => {
    return crypto.createHash('md5').update(password).digest('hex');
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Hash the input password using SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

const validatePayload = async (payload, requiredFields) => {
    const hasRequiredFields = requiredFields.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return { valid: false };
    }

    const hasNoBlankFields = requiredFields.every(prop => {
        const value = payload[prop];
    
        if (typeof value === "string" && value.trim() === "") {
            return false;
        }
    
        if (Array.isArray(value) && value.length === 0) {
            return false;
        }
    
        if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) {
            return false;
        }
    
        return true;
    });

    if (!hasNoBlankFields) {
        return { valid: false };
    }

    return { valid: true };
}

module.exports = {
    getTimestamp,
    toMD5,
    validatePayload,
    hashPassword
}