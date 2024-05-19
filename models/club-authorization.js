const mongoose = require("mongoose");

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
    enum: ["admin", "operator", "developer", "none"],
    default: "none",
  },
  accessKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccessKey",
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
    default: Date.now(),
  },
});

module.exports = mongoose.model("ClubAuthorization", ClubAuthorization);
