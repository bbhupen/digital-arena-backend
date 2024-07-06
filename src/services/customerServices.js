
const insertCustomerDetails = async (payload) => {
    const mandateKeys = ["name", "mobile_no", "address", "password"];
    const hasRequiredFields = mandateKeys.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return {
            "status": "failure",
            "message": "req.body does not have valid parameters",
        };
    }

    return {
        "status": "success"
    }
}

const getCustomerDetails = async (payload) => {
    return {
        "status": "success"
    }
}

module.exports = {
    insertCustomerDetails,
    getCustomerDetails
};