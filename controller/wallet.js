const WalletSchema = require("../models/wallet");
const MemberSchema = require("../models/members");
const CouponSchema = require("../models/coupon");
const TransactionSchema = require("../models/transaction");
const { TransactionFilter } = require("../utils/filters");

exports.getWallet = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member ID is required",
        data: null,
      });
    }

    const member = await MemberSchema.findById(memberId);

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        data: null,
      });
    }

    const wallet = await WalletSchema.findById(member.wallet).populate(
      "transactions memberId"
    );

    if (!wallet) {
      return res.status(404).json({
        statusCode: 404,
        message: "Wallet not found",
        data: null,
        exception: null,
      });
    }

    const walletMember = await MemberSchema.findById(wallet.memberId);

    if (!walletMember) {
      return res.status(404).json({
        statusCode: 404,
        message: "Wallet member not found",
        data: null,
        exception: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Wallet found",
      data: { wallet, member: walletMember },
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      exception: error,
      data: null,
    });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const { memberId, type, payableAmount, couponAmount } = req.body;

    if (!memberId || (type !== "issue" && type !== "receive") || isNaN(payableAmount) || isNaN(couponAmount) || payableAmount < 0 || couponAmount < 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid input data",
        data: null,
      });
    }

    const member = await MemberSchema.findById(memberId);
    if (!member) return res.status(404).json({ statusCode: 404, message: "Member not found", data: null });

    const wallet = await WalletSchema.findById(member.wallet);
    if (!wallet) return res.status(404).json({ statusCode: 404, message: "Wallet not found", data: null });

    const newCoupon = await CouponSchema.create({ amount: couponAmount, memberId: member._id });

    let walletAmount = wallet.balance;
    if (type === "issue") walletAmount -= (couponAmount + payableAmount);
    if (type === "receive") walletAmount += couponAmount;

    wallet.balance = walletAmount;

    const transaction = await TransactionSchema.create({
      walletId: wallet._id,
      memberId: member._id,
      couponId: newCoupon._id,
      walletAmount,
      payableAmount,
      couponAmount,
      type,
      status: type === "issue" ? "paid" : "none",
    });

    await wallet.save();

    return res.status(201).json({
      statusCode: 201,
      message: "Transaction added successfully",
      data: transaction,
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      exception: error,
      data: null,
    });
  }
};


exports.fetchTransactions = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member ID is required",
        data: null,
      });
    }

    const member = await MemberSchema.findById(memberId);

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        data: null,
      });
    }

    const wallet = await WalletSchema.findById(member.wallet);

    if (!wallet) {
      return res.status(404).json({
        statusCode: 404,
        message: "Wallet not found",
        data: null,
      });
    }

    const { type, startDate, endDate, sortBy } = req.query;

    const transactions = await TransactionSchema.find({
      walletId: wallet._id,
      type,
      timeStamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .sort({ timeStamp: sortBy === "asc" ? 1 : -1 })
      .populate("walletId memberId couponId");

    if (transactions.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal Server Error",
      exception: error,
      data: null,
    });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await TransactionSchema.find().populate(
      "walletId memberId couponId"
    );

    if (transactions.length <= 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
        exception: null,
      });
    }

    const totalTransactions = await TransactionSchema.find().countDocuments();

    if (transactions.length <= 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
        exception: null,
      });
    }
    const today = new Date();
    const todaysTotalTransactions = await TransactionSchema.find({
      timeStamp: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999)),
      },
    }).countDocuments();

    if (transactions.length <= 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
        exception: null,
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Transactions fetched successfully",
      data: transactions,
      totalTransactions,
      todaysTotalTransactions,
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      statusCode: 500,
      message: "Internal Server Error",
      exception: error,
      data: null,
    });
  }
};
