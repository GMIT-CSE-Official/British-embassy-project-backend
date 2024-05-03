const Router = require("express");
const {
  createClub,
  login,
  forgetPassword,
  resetPassword,
  getProfile,
  updateClub,
  logout,
} = require("../controller/club");
const {
  validateClubRegistration,
  validateClubLogin,
  validateForgetPassword,
  validateResetPassword,
} = require("../middleware/zod-club-middleware");
const { isAuthenticatedClub } = require("../middleware/club-auth");

const app = Router();

app.post("/create", validateClubRegistration, createClub);
app.post("/login", validateClubLogin, login);
app.get("/logout", isAuthenticatedClub, logout);
app.put("/update", isAuthenticatedClub, updateClub);
app.get("/profile", isAuthenticatedClub, getProfile);
app.put("/forget-password", validateForgetPassword, forgetPassword);
app.put("/reset-password", validateResetPassword, resetPassword);

module.exports = app;
