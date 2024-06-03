const Router = require("express");
const {
  createClub,
  login,
  forgetPassword,
  verifyAccessKey,
  temporaryLogin,
  resendAccessKey,
} = require("../controller/club");
const {
  validateClubRegistration,
  validateClubLogin,
  validateForgetPassword,
} = require("../middleware/zod-club-middleware");

const app = Router();

app.post("/create", validateClubRegistration, createClub);
app.post("/verify-accessKey", verifyAccessKey);
app.post("/login", validateClubLogin, login);
app.post("/forget-password", forgetPassword);
app.post("/temporary-login", validateClubLogin, temporaryLogin);
app.post("/resend-otp", resendAccessKey);

module.exports = app;
