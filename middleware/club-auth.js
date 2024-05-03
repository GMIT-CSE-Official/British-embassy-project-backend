const jwt = require("jsonwebtoken");
class ClubAuth {
  isAuthenticatedClub(req, res, next) {
    const token = req.cookies["auth-token"];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      req.club = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: error.message,
        data: null,
      });
    }
  }
}

module.exports = new ClubAuth();
