const { verify } = require("jsonwebtoken");
const { registrationSchema, loginSchema } = require("../utils/user-zod-schema");

const validateRegistration = (req, res, next) => {
  try {
    registrationSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};

const validateLogin = (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};

module.exports = { validateRegistration, validateLogin };
