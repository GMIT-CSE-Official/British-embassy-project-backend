const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  memberId: {
    type: String,
    ref: "MemberSchema",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransactionSchema",
    },
  ],
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("WalletSchema", walletSchema);
