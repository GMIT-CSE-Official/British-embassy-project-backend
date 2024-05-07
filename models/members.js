const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
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
  image_file_path: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  timeStamp: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("MemberSchema", memberSchema);
