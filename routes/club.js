const Router = require("express");
const {
  createClub,
  login,
  forgetPassword,
  resetPassword,
  verifyAccessKey,
  getProfile,
} = require("../controller/club");
const {
  validateClubRegistration,
  validateClubLogin,
  validateForgetPassword,
  validateResetPassword,
} = require("../middleware/zod-club-middleware");

const app = Router();

app.post("/create", validateClubRegistration, createClub);
app.post("/verify-accessKey", verifyAccessKey);
app.post("/login", validateClubLogin, login);
app.put("/forget-password", validateForgetPassword, forgetPassword);
app.put("/reset-password", validateResetPassword, resetPassword);

module.exports = app;
