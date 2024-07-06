const { selectUserUsingUsername, insertRefreshToken, selectRefreshTokenUsingUsernameToken, selectRefreshTokenUsingUsername } = require("../data_access/userRepo");
const { toMD5 } = require("../helpers/utils");
const jwt = require('jsonwebtoken');
const ApiResponse = require("../helpers/apiresponse");

const secretKey = process.env.JWT_SECRET;

const loginService = async (payload) => {
    let refreshToken = "";
    const mandateKeys = ["username", "password"];
    const hasRequiredFields = mandateKeys.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
    }

    const { username, password } = payload;

    if (username.trim().length === 0 && password.trim().length === 0) {
        return ApiResponse.response("failure", "Please provide valid parameters")
    }

    const inputPassword = await toMD5(password);
    const user = await selectUserUsingUsername(payload);

    const isAuthenticated = inputPassword === user[0]['password'];

    if (!isAuthenticated) {
        return ApiResponse.response("failure", "invalid password or username")
    }

    
    const accessToken = jwt.sign({ username: username, role_id: user[0]['role_id'], location_id: user[0]['location'] }, secretKey, { expiresIn: '1h' });
    const savedToken = await selectRefreshTokenUsingUsername(payload);

    if (!savedToken.length){
        refreshToken = jwt.sign({ username: username, role_id: user[0]['role_id'], location_id: user[0]['location'] }, secretKey);

        const data = {
            "username": username,
            "refreshToken": refreshToken
        }
    
        const insertRes = await insertRefreshToken(data);

        if (insertRes == "error"){
            return ApiResponse.response("failure", "some error occurred");
        }

    }
    const res = {
        "isAuthenticated": isAuthenticated,
        "accessToken": accessToken,
        "refreshToken": savedToken[0].refresh_token
    }

    return ApiResponse.response("success", "record_found", res);

    
}

const refreshAccessToken = async (payload) => {

    const mandateKeys = ["refreshToken", "username"];
    const hasRequiredFields = mandateKeys.every(prop => payload.hasOwnProperty(prop));
    if (!hasRequiredFields) {
        return ApiResponse.response("failure", "req.body does not have valid parameters")
    }

    const savedToken = await selectRefreshTokenUsingUsernameToken(payload);

    if (!savedToken.length){
        return ApiResponse.response("failure", "invalid req token or username")
    }

    const accessToken = jwt.sign({ username: payload["username"] }, secretKey, { expiresIn: '1h' });

    return ApiResponse.response("success", "record_found", {accessToken});
    // Dynamicallly update refreshToken for multiple devices - will need some kind of device id for this implementation. For now a single refresh would do the job.
    // const refreshToken = jwt.sign({ username: payload["username"] }, secretKey);


    // const data = {
    //     "username": payload["username"],
    //     "refreshToken": refreshToken
    // }

    // const insertRes = await insertRefreshToken(data);

    // if (insertRes == "error"){
    //     return ({ 
    //         "status": "failure",
    //         "data": "Some Error Occurred",
    //     });
    // }


}

module.exports = {
    loginService,
    refreshAccessToken
};