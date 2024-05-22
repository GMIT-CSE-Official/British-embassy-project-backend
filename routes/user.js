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
  addOperatorImage,
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
router.post(
  "/add-operator-image",
  isAuthenticated,
  isInClub,
  isOperator,
  addOperatorImage
);
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
router.put("/reset-password/:token", validateResetPassword, resetPassword);
router.put(
  "/sned-reset-token-again",
  validateForgetPassword,
  sendResetTokenAgain
);
router.patch("/change-password", isAuthenticated, isInClub, isUser, isOperator,validateChangePassword, changePassword);
router.get("/logout", isAuthenticated, isInClub, isUser, isOperator, logout);


module.exports = router;
