const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  firstname: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  lastname: {
    type: String,
    required: true,
    min: 6,
    max: 255,
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
  email: {
    type: String,
    min: 6,
    max: 255,
  },
  image: {
    url: {
      type: String,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
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
  idProof: {
    idType: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
    },
  },
  bloodGroup: {
    type: String,
    min: 2,
    max: 5,
  },
  organization: {
    type: String,
    min: 4,
    max: 255,
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WalletSchema",
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
  expiryTime: {
    type: Date,
    required: true,
    default: Date.now() + 1000 * 60 * 60 * 24 * 365,
  },
  expired: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("MemberSchema", memberSchema);
