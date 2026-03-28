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
    const missingFields = [];
    const blankFields = [];

    // Check for missing fields
    requiredFields.forEach(prop => {
        if (!payload.hasOwnProperty(prop)) {
            missingFields.push(prop);
        }
    });

    // Check for blank fields
    requiredFields.forEach(prop => {
        if (!payload.hasOwnProperty(prop)) return; // skip missing ones
        
        const value = payload[prop];

        if (typeof value === "string" && value.trim() === "") {
            blankFields.push(prop);
            return;
        }

        if (Array.isArray(value) && value.length === 0) {
            blankFields.push(prop);
            return;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) {
            blankFields.push(prop);
            return;
        }
    });

    if (missingFields.length > 0 || blankFields.length > 0) {
        console.log({ missingFields, blankFields });
        return {
            valid: false,
            missingFields,
            blankFields
        };
    }

    return { valid: true };
};


module.exports = {
    getTimestamp,
    toMD5,
    validatePayload,
    hashPassword
}