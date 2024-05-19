const mongoose = require("mongoose");

const accessKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  expiryTime: {
    type: Date,
    default: Date.now() + 60 * 1000,
  },
  timestamps: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("AccessKey", accessKeySchema);
