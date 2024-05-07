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
  validateAddMember,
} = require("../middleware/zod-user-middleware");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const { validate } = require("../models/club-authorization");
const {
  addMember,
  updateMember,
  deleteMember,
  getAllMembers,
  searchMember,
} = require("../controller/member");
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

router.post("/add-member", isAuthenticated, validateAddMember, addMember);
router.post("/update-member", isAuthenticated, validateAddMember, updateMember);
router.post("/delete-member", isAuthenticated, deleteMember);
router.get("/all-members", isAuthenticated, getAllMembers);
router.get("/search-member/:key", isAuthenticated, searchMember);

module.exports = router;
