const Router = require("express");
const {
  register,
  updateOperator,
  loginUser,
  forgetPassword,
  resetPassword,
  sendResetTokenAgain,
  changePassword,
  getCurrentUser,
  getAllOperators,
  updateOperatorImage,
} = require("../controller/user");
const {
  validateRegistration,
  validateLogin,
  validateForgetPassword,
  validateResetPassword,
  validateChangePassword,
} = require("../middleware/zod-user-middleware");

const {
  isAuthenticated,
  isInClub,
  isOperator,
  isUser,
} = require("../middleware/auth");
const router = Router();

// Routes
router.post(
  "/register",
  isAuthenticated,
  isInClub,
  validateRegistration,
  register
);
router.post(
  "/update-operator-image",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateOperatorImage
);
router.get("/profile", isAuthenticated, getCurrentUser);
router.get("/profile-all", isAuthenticated, isInClub, getAllOperators);
router.post("/login", isAuthenticated, isInClub, validateLogin, loginUser);
router.put(
  "/update",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  updateOperator
);
router.put("/forgot-password", validateForgetPassword, forgetPassword);
router.put("/reset-password/:token", validateResetPassword, resetPassword);
router.put(
  "/sned-reset-token-again",
  validateForgetPassword,
  sendResetTokenAgain
);
router.patch(
  "/change-password",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  validateChangePassword,
  changePassword
);

module.exports = router;
