const {
  registrationSchema,
  loginSchema,
  forgrtPasswordSchema,
  resetPasswordSchema,
  addMemberSchema,
  changePasswordSchema,
} = require("../utils/user-zod-schema");

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

const validateForgetPassword = (req, res, next) => {
  try {
    forgrtPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};
const validateResetPassword = (req, res, next) => {
  try {
    resetPasswordSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};

const validateAddMember = (req, res, next) => {
  try {
    addMemberSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};

const validateChangePassword = (req, res, next) => {
  try {
    changePasswordSchema.parse(req.body);
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
}

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgetPassword,
  validateResetPassword,
  validateAddMember,
  validateChangePassword
};
