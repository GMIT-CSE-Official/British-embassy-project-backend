const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  mobileNumber: {
    type: String,
    required: true,
    min: 10,
    max: 15,
  },
  image: {
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
  },
  address: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WalletSchema",
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("MemberSchema", memberSchema);
