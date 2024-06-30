const Router = require("express");
const router = Router();
const { isAuthenticated, isInClub } = require("../middleware/auth.js");
const {
  getWallet,
  addTransaction,
  fetchTransactions,
  getAllTransactions,
  downloadTransactionAsCSV,
} = require("../controller/wallet.js");

router.get("/get/:memberId", isAuthenticated, isInClub, getWallet);
router.post("/addTransaction", isAuthenticated, isInClub, addTransaction);
router.get(
  "/fetchTransactions",
  isAuthenticated,
  isInClub,
  fetchTransactions
);
router.get("/get-transactions", isAuthenticated, isInClub, getAllTransactions);

router.get(
  "/download-tr-csv",
  isAuthenticated,
  isInClub,
  downloadTransactionAsCSV
);

module.exports = router;
