const jwt = require("jsonwebtoken");
const AuthResponse = require("../helpers/authresponse");
const secretKey = process.env.JWT_SECRET;

const verifyAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return AuthResponse.noAuthHeader(res);

  if (!authHeader.startsWith("Bearer "))
    return AuthResponse.invalidFormat(res);

  const token = authHeader.split(" ")[1];

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError")
        return AuthResponse.tokenExpired(res);

      return AuthResponse.invalidToken(res);
    }

    req.user = user;
    next();
  });
};

module.exports = { verifyAccessToken };
