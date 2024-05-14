const Router = require("express");
const router = Router();
const { addWallet } = require("../controller/wallet.js");

router.post("/add", addWallet);

module.exports = router;
