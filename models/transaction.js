const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WalletSchema",
  },
  memberId: {
    type: String,
    ref: "MemberSchema",
    required: true,
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CouponSchema",
  },
  walletAmount: {
    type: Number,
    required: true,
  },
  payableAmount: {
    type: Number,
    required: true,
  },
  couponAmount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["issue", "receive"],
    required: true,
  },
  status: {
    type: String,
    enum: ["due", "paid", "none"],
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("TransactionSchema", transactionSchema);
