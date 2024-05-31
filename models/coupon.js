const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  memberId: {
    type: String,
    ref: "MemberSchema",
    required: true,
  },
  timeStamp: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("CouponSchema", couponSchema);
