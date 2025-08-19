const { selectUserUsingUsername, insertRefreshToken, selectRefreshTokenUsingUsernameToken, selectRefreshTokenUsingUsername } = require("../data_access/userRepo");
const { toMD5, validatePayload, hashPassword } = require("../helpers/utils");
const jwt = require('jsonwebtoken');
const ApiResponse = require("../helpers/apiresponse");
const resCode = require("../helpers/responseCodes");
// const upload = require("../helpers/multer");
const fs = require('fs');

const secretKey = process.env.JWT_SECRET;

const loginService = async (payload) => {
    try {
        let refreshToken = "";
        const mandateKeys = ["username", "password"];
        const validation = await validatePayload(payload, mandateKeys);
        var role_id = "";
        var location_id = "";
        var location = "";

    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }
        const { username, password } = payload;

        // const inputPassword = await toMD5(password);
        const inputPassword = await hashPassword(password.trim());
        const user = await selectUserUsingUsername(payload);

        if (!user.length){
            return ApiResponse.response(resCode.INVALID_USERNAME_PASSWORD, "failure", "invalid password or username")
        }

        const isAuthenticated = inputPassword === user[0]['password'];

        if (!isAuthenticated) {
            return ApiResponse.response(resCode.INVALID_USERNAME_PASSWORD, "failure", "invalid password or username")
        }
        else
        {
            role_id = user[0]['role_id'];
            location_id = user[0]['location'];
            location = user[0]['location_name'];
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
                return ApiResponse.response(resCode.FAILURE, "failure", "some error occurred");
            }

        }
        const res = {
            "isAuthenticated": isAuthenticated,
            "accessToken": accessToken,
            "refreshToken": savedToken[0].refresh_token,
            "username": username,
            "location_id": location_id,
            "location_name": location,
            "role_id": role_id
        }

        return ApiResponse.response(resCode.SUCCESS, "success", "auth successfull", res);
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");
    }   

    
}

const refreshAccessToken = async (payload) => {

    try {
        const mandateKeys = ["refreshToken", "username"];
        const validation = await validatePayload(payload, mandateKeys);
    
        if (!validation.valid) {
            return ApiResponse.response(resCode.INVALID_PARAMETERS, "failure", "req.body does not have valid parameters")
        }

        const savedToken = await selectRefreshTokenUsingUsernameToken(payload);
    
        if (!savedToken.length){
            return ApiResponse.response(resCode.INVALID_REF_TOKEN, "failure", "invalid access token or username, please re-authenticate")
        }
    
        const accessToken = jwt.sign({ username: payload["username"] }, secretKey, { expiresIn: '1h' });
    
        return ApiResponse.response(resCode.SUCCESS, "success", "token refreshed", {accessToken});
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
    } catch (error) {
        console.log(error)
        return ApiResponse.response(resCode.FAILURE, "failure", "some unexpected error occurred");         
    }

}

const uploadImageService = async (file) => {
  try {
    if (!file) {
      return ApiResponse.response( resCode.INVALID_PARAMETERS,"failure","No file uploaded");
    }

    // Validate file type
    if (!file.mimetype.startsWith("image/")) {
      // cleanup invalid file
      fs.unlinkSync(file.path);
      return ApiResponse.response(
        resCode.INVALID_PARAMETERS,
        "failure",
        "Invalid file type. Only image files are allowed"
      );
    }
    
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      // cleanup oversized file
      fs.unlinkSync(file.path);
      return ApiResponse.response(
        resCode.INVALID_PARAMETERS,
        "failure",
        `File too large. Max allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB`
      );
    }

    return ApiResponse.response( resCode.SUCCESS, "success", "image uploaded",
    {
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
      }
    );
  } catch (error) {
    console.error(error);
    return ApiResponse.response( resCode.FAILURE, "failure","Unexpected error occurred");
  }
};

module.exports = {
    loginService,
    refreshAccessToken,
    uploadImageService
};