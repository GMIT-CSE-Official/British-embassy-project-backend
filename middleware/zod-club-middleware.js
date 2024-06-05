const {
  clubRegistrationSchema,
  clubLoginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
} = require("../utils/club-zod-schema");

const validateClubRegistration = async (req, res, next) => {
  try {
    clubRegistrationSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: errorMsg,
      error: "Invalid request body",
    });
  }
};

const validateClubLogin = async (req, res, next) => {
  try {
    clubLoginSchema.parse(req.body);
    next();
  } catch (error) {
    const errorMsg = error.errors.map((err) => err.message).join(", ");
    res.status(400).json({
      message: errorMsg,
      error: "Invalid request body",
    });
  }
};

const validateForgetPassword = async (req, res, next) => {
  try {
    forgetPasswordSchema.parse(req.body);
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
    return res.status(400).json({
      message: "Invalid request body",
      error: errorMsg,
    });
  }
};

module.exports = {
  validateClubRegistration,
  validateClubLogin,
  validateForgetPassword,
  validateResetPassword,
};
