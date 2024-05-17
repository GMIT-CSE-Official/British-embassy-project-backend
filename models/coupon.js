const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    couponDetails: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
});