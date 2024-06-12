const { getUsers } = require("../data_access/salesRepo");

const allUser = async () => {
    const users = await getUsers();

    const response = {
        "users": {
            users
        }
    }

    return {
        response
    }
}

const insertData = async (payload) => {

    const { username, password } = payload;

    const response = {
        "primaryContactId": "response_is_fine",
    };


    return {
        "contact": {
            response
        }
    }
}

module.exports = {
    insertData,
    allUser
};