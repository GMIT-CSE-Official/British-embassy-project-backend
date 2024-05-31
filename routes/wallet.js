const Router = require("express");
const router = Router();
const { isAuthenticated, isInClub } = require("../middleware/auth.js");
const {
  getWallet,
  addTransaction,
  fetchTransactions,
  updateTransaction,
  updateCouponExpires,
  getAllTransactions,
} = require("../controller/wallet.js");

router.get("/get/:memberId", isAuthenticated, isInClub, getWallet);
router.post("/addTransaction", isAuthenticated, isInClub, addTransaction);
router.get(
  "/fetchTransactions/:memberId",
  isAuthenticated,
  isInClub,
  fetchTransactions
);

router.put(
  "/update-transaction/:transactionId",
  isAuthenticated,
  isInClub,
  updateTransaction
);

router.put(
  "/update-coupon/:couponId",
  isAuthenticated,
  isInClub,
  updateCouponExpires
);

router.get("/get-transactions", isAuthenticated, isInClub, getAllTransactions);

module.exports = router;
