const resCode = require("./responseCodes");

class AuthResponse {

  static noAuthHeader(res) {
    return res.status(401).json({
      status_code: resCode.AUTHORIZATION_ERROR,
      status: "error",
      message: "Authorization header not found",
      data: {}
    });
  }

  static invalidFormat(res) {
    return res.status(401).json({
      status_code: resCode.AUTHORIZATION_ERROR,
      status: "error",
      message: "Invalid authorization format",
      data: {}
    });
  }

  static tokenExpired(res) {
    return res.status(401).json({
      status_code: resCode.AUTHORIZATION_ERROR,
      status: "error",
      message: "Access token expired",
      data: {}
    });
  }

  static invalidToken(res) {
    return res.status(403).json({
      status_code: resCode.AUTHORIZATION_ERROR,
      status: "error",
      message: "Invalid access token",
      data: {}
    });
  }

  static forbidden(res, message = "Forbidden") {
    return res.status(403).json({
      status_code: resCode.AUTHORIZATION_ERROR,
      status: "error",
      message,
      data: {}
    });
  }
}

module.exports = AuthResponse;
