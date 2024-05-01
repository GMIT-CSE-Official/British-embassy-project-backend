const Router = require("express");
const {
  register,
  getAllOperators,
  updateOperator,
  loginUser,
  getOperatorById,
  forgetPassword,
} = require("../controller/user");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/zod-user-middleware");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const router = Router();

// Routes
router.get("/all", isAuthenticated, isAdmin, getAllOperators);
router.post("/register", validateRegistration, register);
router.post("/login", validateLogin, loginUser);
router.put("/update", isAuthenticated, updateOperator);
router.post("/forgot-password", forgetPassword);
router.get("/reset-password/:token");
router.get("/logout");
router.get("/profile", isAuthenticated, getOperatorById);

module.exports = router;
