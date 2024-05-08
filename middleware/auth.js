const jwt = require("jsonwebtoken");
const { decryptPayload } = require("../controller/user");
class Auth {
  #ADMIN_ROLE = "admin";
  #OPERATOR_ROLE = "operator";
  #DEVELOPER_ROLE = "developer";
  #CLUB_ROLE = "club";
  constructor() {
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.isUser = this.isUser.bind(this);
    this.isAdmin = this.isAdmin.bind(this);
    this.isOperator = this.isOperator.bind(this);
    this.isDeveloper = this.isDeveloper.bind(this);
    this.isInClub = this.isInClub.bind(this);
    console.log("Auth Middleware Loaded");
  }
  isAuthenticated(req, res, next) {
    const token = req.cookies["auth-token"];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Please login with club credentials",
        exception: null,
        data: null,
      });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.club = decoded.club;
      next();
    } catch (error) {
      return res.status(401).json({
        statusCode: 401,
        message: "Please login with club credentials",
        exception: error.message,
        data: null,
      });
    }
  }
  async isUser(req, res, next) {
    const token = req.cookies["user-token"];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Please login with operator credentials",
        exception: null,
        data: null,
      });
    }
    try {
      const decoded = await decryptPayload(token);
      const parsedDecoded = JSON.parse(decoded);
      if (!decoded) {
        return res.status(401).json({
          statusCode: 401,
          message: "Unauthorized access",
          exception: null,
          data: null,
        });
      }
      req.user = parsedDecoded.user;
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
    if (req.club.role !== this.#ADMIN_ROLE) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    next();
  }
  isInClub(req, res, next) {
    if (!req.club) {
      return res.status(401).json({
        statusCode: 401,
        message: "Please login with club credentials",
        exception: null,
        data: null,
      });
    }
    if (req.club.role !== this.#CLUB_ROLE) {
      return res.status(401).json({
        statusCode: 401,
        message: "Login as club to access the resource",
        exception: null,
        data: null,
      });
    }
    next();
  }
  isOperator(req, res, next) {
    console.log(req.user);
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
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
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
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
