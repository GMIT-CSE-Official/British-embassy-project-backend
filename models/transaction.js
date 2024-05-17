const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletSchema',
    },
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MemberSchema',
    },
    payableAmount: {
        type: Number,
        required: true,
    },
    couponAmount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
    });