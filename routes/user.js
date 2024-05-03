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
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const router = Router();

// Routes
router.get("/all", isAuthenticated, isAdmin, getAllOperators);
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, loginUser);
router.put("/update", isAuthenticated, updateOperator);
router.put("/forgot-password", validateForgetPassword, forgetPassword);
router.put("/reset-password", validateResetPassword, resetPassword);
router.put(
  "/sned-reset-token-again",
  validateForgetPassword,
  sendResetTokenAgain
);
router.get("/logout", isAuthenticated, logout);
router.get("/profile", isAuthenticated, getOperatorById);

module.exports = router;
