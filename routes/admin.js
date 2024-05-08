const Router = require("express");
const { getProfile, updateClub } = require("../controller/club");

const { isAuthenticated, isAdmin } = require("../middleware/auth");

const app = Router();

app.put("/update", isAuthenticated, isAdmin, updateClub);
app.get("/profile", isAuthenticated, isAdmin, getProfile);

module.exports = app;
