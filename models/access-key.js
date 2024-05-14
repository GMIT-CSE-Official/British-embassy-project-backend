const mongoose = require("mongoose");

const accessKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  timestamps: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("AccessKey", accessKeySchema);
