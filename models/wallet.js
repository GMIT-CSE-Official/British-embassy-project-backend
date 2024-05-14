const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MemberSchema",
  },
  balance: {
    type: Number,
    required: true,
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
