function generateRandomPrefix(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

function generateBillId(yearRange, sequence) {
    const randomPrefix = process.env.BILL_PREFIX; // some fix prefix
    return `${randomPrefix}/${yearRange}/${sequence}`;
}

module.exports = {
    generateBillId
}