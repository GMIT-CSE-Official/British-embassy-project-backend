const mongoose = require("mongoose");
const crypto = require("crypto");

const Operators = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profileImage: {
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
  },
  role: {
    type: String,
    enum: ["operator"],
    default: "operator",
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
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

Operators.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash(process.env.HASH_ALGO)
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  this.save();
  return resetToken;
};
module.exports = mongoose.model("Operator", Operators);
