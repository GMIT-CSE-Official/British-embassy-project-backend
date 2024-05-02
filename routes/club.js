const Router = require("express");
const {
  createClub,
  login,
  forgetPassword,
  resetPassword,
  getProfile,
  updateClub,
} = require("../controller/club");
const {
  validateClubRegistration,
  validateClubLogin,
  validateForgetPassword,
  validateResetPassword,
  validateClubUpdate,
} = require("../middleware/zod-club-middleware");
const { isAuthenticatedClub } = require("../middleware/club-auth");

const app = Router();

app.post("/create", validateClubRegistration, createClub);
app.post("/login", validateClubLogin, login);
app.put("/update", isAuthenticatedClub, validateClubUpdate, updateClub);
app.get("/profile", isAuthenticatedClub, getProfile);
app.put("/forget-password", validateForgetPassword, forgetPassword);
app.put("/reset-password", validateResetPassword, resetPassword);

module.exports = app;
