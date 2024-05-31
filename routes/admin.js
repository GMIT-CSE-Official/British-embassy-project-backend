const Router = require("express");
const {
  getProfile,
  updateClub,
  resetPassword,
  changeRole,
  removeOperator,
  changePassword,
  getAllUsers,
  changePasswordAll,
  changeOperatorPassword,
} = require("../controller/club");

const {
  isAuthenticated,
  isAdmin,
  isTemporaryAdmin,
} = require("../middleware/auth");
const {
  validateResetPassword,
  validateChangePassword,
} = require("../middleware/zod-user-middleware");
const { getAllOperators } = require("../controller/user");

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
app.get("/get-all-operators", isAuthenticated, isAdmin, getAllOperators);
app.get("/get-all-users", isAuthenticated, isAdmin, getAllUsers);
app.post("/change-role", isAuthenticated, isAdmin, changeRole);
app.delete(
  "/delete-operator/:operatorId",
  isAuthenticated,
  isAdmin,
  removeOperator
);
app.patch(
  "/change-password",
  isAuthenticated,
  isAdmin,
  validateChangePassword,
  changePassword
);
app.patch(
  "/change-password-all/:id",
  isAuthenticated,
  isAdmin,
  changePasswordAll
);
app.patch(
  "/change-operator-password/:operatorId",
  isAuthenticated,
  isAdmin,
  changeOperatorPassword
);

module.exports = app;
