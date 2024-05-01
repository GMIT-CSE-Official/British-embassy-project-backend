const jwt = require("jsonwebtoken");
class Auth {
  #ADMIN_ROLE = "admin";
  #OPERATOR_ROLE = "operator";
  #DEVELOPER_ROLE = "developer";
  isAuthenticated(req, res, next) {
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
      req.user = decoded.user;
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
  isAdmin(req, res, next) {
    if (req.user.role !== this.#ADMIN_ROLE) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    next();
  }
  isOperator(req, res, next) {
    if (req.user.role !== this.#OPERATOR_ROLE) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    next();
  }
  isDeveloper(req, res, next) {
    if (req.user.role !== this.#DEVELOPER_ROLE) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    next();
  }
}
module.exports = new Auth();
