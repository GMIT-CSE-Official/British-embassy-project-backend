const Router = require("express");
const router = Router();
const {
  isAuthenticated,
  isInClub,
  isOperator,
  isUser,
} = require("../middleware/auth.js");
const {
  addWallet,
  getWallet,
  addTransaction,
  fetchTransactions,
} = require("../controller/wallet.js");

router.post("/add", isAuthenticated, isInClub, isUser, isOperator, addWallet);
router.get("/get", isAuthenticated, isInClub, isUser, isOperator, getWallet);
router.post(
  "/addTransaction",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  addTransaction
);
router.get(
  "/fetchTransactions/:memberId",
  isAuthenticated,
  isInClub,
  isUser,
  isOperator,
  fetchTransactions
);

module.exports = router;
