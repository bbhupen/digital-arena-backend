const { selectPasswordUsingUsername, insertRefreshToken, selectRefreshTokenUsingUsername } = require("../data_access/userRepo");
const { toMD5 } = require("../helpers/utils");
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET;

const loginService = async (payload) => {

    const { username, password } = payload
    const inputPassword = await toMD5(password);
    const userPassword = await selectPasswordUsingUsername(payload);

    const isAuthenticated = inputPassword === userPassword[0]['password'];

    if (!isAuthenticated) {
        return ({ 
            "status": "failure",
            "data": "Password or username incorrect",
         });
    }

    const accessToken = jwt.sign({ username: username }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ username: username }, secretKey);

    const data = {
        "username": username,
        "refreshToken": refreshToken
    }

    const insertRes = await insertRefreshToken(data);

    if (insertRes == "error"){
        return ({ 
            "status": "failure",
            "data": "Some Error Occurred",
        });
    }

    return {
        "status": "success",
        "isAuthenticated": isAuthenticated,
        "accessToken": accessToken,
        "refreshToken": refreshToken
    }
}

const refreshAccessToken = async (payload) => {

    const mandateKeys = ["refreshToken", "username"];
    const hasRequiredFields = mandateKeys.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return {
            "status": "failure",
            "message": "req.body does not have valid parameters",
        };
    }
    const savedToken = await selectRefreshTokenUsingUsername(payload);

    if (!savedToken.length){
        return {
            "status": "failure",
            "message": "invalid req token or username",
        };
    }


    const accessToken = jwt.sign({ username: payload["username"] }, secretKey, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ username: payload["username"] }, secretKey);


    const data = {
        "username": payload["username"],
        "refreshToken": refreshToken
    }

    const insertRes = await insertRefreshToken(data);

    if (insertRes == "error"){
        return ({ 
            "status": "failure",
            "data": "Some Error Occurred",
        });
    }


    return {
        "status": "success",
        "accessToken": accessToken,
        "refreshToken": refreshToken
    }
}

module.exports = {
    loginService,
    refreshAccessToken
};