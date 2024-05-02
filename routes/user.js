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
router.put("/forgot-password", (req, res) => {
  res.send("This route is under devlopment");
});
router.put("/reset-password", (req, res) => {
  res.send("This route is under devlopment");
});
router.get("/logout", (req, res) => {
  res.send("This route is under devlopment");
});
router.get("/profile", (req, res) => {
  res.send("This route is under devlopment");
});

module.exports = router;
