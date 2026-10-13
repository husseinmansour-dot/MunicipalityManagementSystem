
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (
    typeof authHeader !== "string" ||
    !/^Bearer \S+$/.test(authHeader)
  ) {
    return res.status(401).json({
      message: "Authentication token required"
    });
  }

  const token = authHeader.slice(7);

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");

    return res.status(500).json({
      message: "Authentication service unavailable"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"]
      }
    );

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !Number.isSafeInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      return res.status(401).json({
        message: "Invalid authentication token"
      });
    }

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

module.exports = authenticateToken;
