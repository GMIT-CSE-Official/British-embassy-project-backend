const mongoose = require("mongoose");
const crypto = require("crypto");

const ClubAuthorization = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "club"],
    default: "club",
  },
  accessKey: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  temporary: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    expires: 3600,
    default: Date.now(),
  },
});

ClubAuthorization.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash(process.env.HASH_ALGO)
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  this.save();
  return resetToken;
};

module.exports = mongoose.model("ClubAuthorization", ClubAuthorization);
