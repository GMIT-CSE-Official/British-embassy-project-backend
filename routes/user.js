const Router = require("express");
const {
  register,
  getAllOperators,
  updateOperator,
  loginUser,
  getOperatorById,
  forgetPassword,
  resetPassword,
  logout,
  sendResetTokenAgain,
} = require("../controller/user");
const {
  validateRegistration,
  validateLogin,
  validateForgetPassword,
  validateResetPassword,
} = require("../middleware/zod-user-middleware");

const {
  isAuthenticated,
  isAdmin,
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
router.get("/all", isAuthenticated, isAdmin, getAllOperators);
router.get(
  "/profile",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  getOperatorById
);
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
router.put("/reset-password", validateResetPassword, resetPassword);
router.put(
  "/sned-reset-token-again",
  validateForgetPassword,
  sendResetTokenAgain
);
router.get("/logout", isAuthenticated, logout);

module.exports = router;
