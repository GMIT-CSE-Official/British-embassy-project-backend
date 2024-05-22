const Router = require("express");
const {
  getProfile,
  updateClub,
  resetPassword,
  logout,
  changeRole,
  getAllOperator,
  removeOperator,
  changePassword,
} = require("../controller/club");

const {
  isAuthenticated,
  isAdmin,
  isTemporaryAdmin,
} = require("../middleware/auth");
const { validateResetPassword, validateChangePassword } = require("../middleware/zod-user-middleware");

const app = Router();

app.put("/update", isAuthenticated, isAdmin, updateClub);
app.get("/profile", isAuthenticated, isAdmin, getProfile);
app.put(
  "/reset-password",
  isAuthenticated,
  isTemporaryAdmin,
  validateResetPassword,
  resetPassword
);
app.get("/logout", isAuthenticated, isAdmin, logout);
app.get("/temporary-logout", isAuthenticated, isTemporaryAdmin, logout);
app.get("/get-all-operator", isAuthenticated, isAdmin, getAllOperator);
app.post("/change-role", isAuthenticated, isAdmin, changeRole);
app.delete(
  "/delete-operator/:operatorId",
  isAuthenticated,
  isAdmin,
  removeOperator
);
app.patch("/change-password", isAuthenticated, isAdmin,validateChangePassword, changePassword);

module.exports = app;
