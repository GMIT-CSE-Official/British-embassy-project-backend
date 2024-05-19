const WalletSchema = require("../models/wallet");
const MemberSchema = require("../models/members");
const CouponSchema = require("../models/coupon");
const TransactionSchema = require("../models/transaction");
const { TransactionFilter } = require("../utils/filters");
const Cache = require("node-cache");

const cache = new Cache();

exports.addWallet = async (req, res) => {
  try {
    const { memberId, balance } = req.body;

    if (!memberId || !balance) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member ID and Balance are required",
        data: null,
      });
    }

    if (isNaN(balance)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Balance should be a number",
        data: null,
      });
    }

    if (balance < 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Balance should be greater than 0",
        data: null,
      });
    }

    if (cache.get(memberId)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Wallet already exists for this member",
        data: null,
      });
    }

    const member = await MemberSchema.findById(memberId).populate("wallet");

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        data: null,
      });
    }

    if (member.wallet) {
      return res.status(400).json({
        statusCode: 400,
        message: "Wallet already exists for this member",
        data: null,
      });
    }

    const wallet = new WalletSchema({
      balance,
    });

    await wallet.save();

    member.wallet = wallet;

    await member.save();

    cache.set(wallet._id, wallet);

    return res.status(200).json({
      statusCode: 200,
      message: "Wallet created successfully",
      data: wallet,
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
      "transactions"
    );

    if (!wallet) {
      return res.status(404).json({
        statusCode: 404,
        message: "Wallet not found",
        data: null,
        exception: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Wallet found",
      data: wallet,
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

    if (!memberId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member ID is required",
        data: null,
      });
    }

    if (type !== "issue" || type !== "receive") {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid transaction type",
        data: null,
      });
    }

    if (isNaN(payableAmount) || isNaN(couponAmount)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Amount should be a number",
        data: null,
      });
    }

    if (payableAmount < 0 || couponAmount < 0) {
      return res.status(400).json({
        statusCode: 400,
        message: "Amount should be greater than 0",
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

    const newCoupon = await CouponSchema.create({
      amount: couponAmount,
      memberId,
    });

    const transaction = await TransactionSchema.create({
      walletId: wallet._id,
      memberId,
      couponId: newCoupon._id,
      walletAmount: wallet.balance + payableAmount - couponAmount,
      payableAmount,
      couponAmount,
      type,
      status:
        wallet.balance + payableAmount - couponAmount < 0 ? "due" : "paid",
    });

    wallet.balance = wallet.balance + payableAmount - couponAmount;

    wallet.transactions.push(transaction);

    await wallet.save();

    return res.status(200).json({
      statusCode: 200,
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

    const filter = new TransactionFilter({
      walletId: wallet._id,
      memberId,
      type,
      startDate,
      endDate,
      sortBy,
    })
      .filter()
      .sort()
      .paginate();

    const transactions = await filter.exec();

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
