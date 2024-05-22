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
  updateTransaction,
} = require("../controller/wallet.js");

router.post("/add", isAuthenticated, isInClub, isUser, isOperator, addWallet);
router.get("/get/:memberId", isAuthenticated, isInClub, isUser, isOperator, getWallet);
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

router.put("/update-transaction/:transactionId", isAuthenticated, isInClub, isUser, isOperator, updateTransaction);

router.put("/update-coupon/:couponId", isAuthenticated, isInClub, isUser, isOperator, updateCouponExpires);



module.exports = router;
