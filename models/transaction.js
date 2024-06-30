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
  creditAmount: {
    type: Number,
    required: true,
  },
  debitAmount: {
    type: Number,
    required: true,
  },
  walletAmount: {
    type: Number,
    required: true,
  },
  payableAmount: {
    type: Number,
  },
  couponAmount: {
    type: Number,
  },
  memberName: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
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
  mode: {
    type: String,
    enum: ["CASH", "CARD", "UPI", "WALLET"],
    default: "WALLET",
  },
  timeStamp: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("TransactionSchema", transactionSchema);
