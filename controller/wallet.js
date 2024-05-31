const WalletSchema = require("../models/wallet");
const MemberSchema = require("../models/members");
const CouponSchema = require("../models/coupon");
const TransactionSchema = require("../models/transaction");
const { TransactionFilter } = require("../utils/filters");
const Cache = require("node-cache");

const cache = new Cache();

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

    if (!memberId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member ID is required",
        data: null,
      });
    }

    if (type !== "issue" && type !== "receive") {
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
      memberId: member._id,
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

exports.getAllTransactions = async () => {
  try {
    const transactions = await TransactionSchema.find().populate(
      "walletId memberId couponId"
    );
    if (transactions.length <= 0) {
      return {
        statusCode: 404,
        message: "No transactions found",
        data: null,
      };
    }
    return {
      statusCode: 200,
      message: "Transactions fetched successfully",
      data: transactions,
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      message: "Internal Server Error",
      exception: error,
      data: null,
    };
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Transaction ID is required",
        data: null,
      });
    }

    const { type, payableAmount, couponAmount } = req.body;

    if (type !== "issue" && type !== "receive") {
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

    const transaction = await TransactionSchema.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        statusCode: 404,
        message: "Transaction not found",
        data: null,
      });
    }

    const wallet = await WalletSchema.findById(transactionId);

    if (!wallet) {
      return res.status(404).json({
        statusCode: 404,
        message: "Wallet not found",
        data: null,
      });
    }

    const member = await MemberSchema.findById(transactionId);

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        data: null,
      });
    }

    const updatedCoupon = await CouponSchema.findByIdAndUpdate(
      transaction.couponId,
      {
        amount: couponAmount,
        memberId: member._id,
      }
    );

    transaction.walletAmount = wallet.balance + payableAmount - couponAmount;
    transaction.payableAmount = payableAmount;
    transaction.couponAmount = couponAmount;
    transaction.type = type;
    transaction.status =
      wallet.balance + payableAmount - couponAmount < 0 ? "due" : "paid";

    await transaction.save();

    wallet.balance = wallet.balance + payableAmount - couponAmount;

    await wallet.save();

    return res.status(200).json({
      statusCode: 200,
      message: "Transaction updated successfully",
      data: transaction,
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

exports.updateCouponExpires = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!couponId) {
      return res.status(400).json({
        statusCode: 400,
        message: "Coupon ID is required",
        data: null,
      });
    }

    const { expiresAt } = req.body;

    if (!expiresAt) {
      return res.status(400).json({
        statusCode: 400,
        message: "Expires at is required",
        data: null,
      });
    }

    const coupon = await CouponSchema.findById(couponId);

    if (!coupon) {
      return res.status(404).json({
        statusCode: 404,
        message: "Coupon not found",
        data: null,
      });
    }

    coupon.expiresAt = expiresAt;

    await coupon.save();

    return res.status(200).json({
      statusCode: 200,
      message: "Coupon expires updated successfully",
      data: coupon,
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
