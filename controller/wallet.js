const WalletSchema = require("../models/wallet");
const MemberSchema = require("../models/members");
const CouponSchema = require("../models/coupon");
const TransactionSchema = require("../models/transaction");
const { sendMail } = require("../utils/mail-service");

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
    const { memberId, type, payableAmount, couponAmount, mode } = req.body;

    if (!memberId || !mode) {
      return res.status(400).json({
        statusCode: 400,
        message: !memberId ? "Member ID is required" : "Mode is required",
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

    if (
      isNaN(payableAmount) ||
      isNaN(couponAmount) ||
      payableAmount < 0 ||
      couponAmount < 0
    ) {
      return res.status(400).json({
        statusCode: 400,
        message: "Amount should be a non-negative number",
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

    let walletAmount,
      transactionStatus,
      creditAmount = 0,
      debitAmount = 0;

    if (type === "issue") {
      walletAmount = wallet.balance - (couponAmount - payableAmount);
      debitAmount = couponAmount - payableAmount;
      transactionStatus = "paid";
    } else {
      walletAmount = wallet.balance + couponAmount;
      creditAmount = couponAmount;
      transactionStatus = "none";
    }

    wallet.balance = walletAmount;

    const transaction = await TransactionSchema.create({
      walletId: wallet._id,
      memberId: member._id,
      couponId: newCoupon._id,
      walletAmount,
      payableAmount,
      couponAmount,
      type,
      status: transactionStatus,
      timeStamp: new Date(),
      mode: mode.toUpperCase(),
      creditAmount,
      debitAmount,
      memberName: member.name,
      firstname: member.firstname,
      lastname: member.lastname,
      mobileNumber: member.mobileNumber,
    });

    await wallet.save();

    await sendMail(
      member.email,
      "Transaction Details",
      `Your transaction with ID ${transaction._id} has been ${transactionStatus}.`,
      `
      <h1>Transaction Details</h1>
      <p>Your transaction with ID ${transaction._id} has been ${transactionStatus}.</p>
      <p>MEMBER ID:${memberId} with Name:${member.name}</p>
      <p>Transaction Type: ${type}</p>
      <p>Mode:${mode}</p>
      <p>Credited Amount : ${creditAmount}</p>
      <p>Debited Amount : ${debitAmount}</p>
      <p>Wallet Amount : ${walletAmount}</p>
      `
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayTransactions = await TransactionSchema.aggregate([
      {
        $match: {
          timeStamp: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalCredited: { $sum: "$creditAmount" },
          totalDebited: { $sum: "$debitAmount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const { totalCredited, totalDebited, totalTransactions } =
      todayTransactions[0] || {
        totalCredited: 0,
        totalDebited: 0,
        totalTransactions: 0,
      };

    return res.status(201).json({
      statusCode: 201,
      message: "Transaction added successfully",
      data: {
        transaction,
        totalCredited,
        totalDebited,
        totalTransactions,
      },
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
    const { startDate, endDate, search } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.timeStamp = {
        $gte: new Date(startDate),
        $lt: new Date(
          new Date(endDate).setDate(new Date(endDate).getDate() + 1)
        ),
      };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { memberName: { $regex: searchRegex } },
        { memberId: { $regex: searchRegex } },
        { mobileNumber: { $regex: searchRegex } },
      ];
    }

    const transactions = await TransactionSchema.find(query)
      .populate("walletId couponId")
      .sort({ timeStamp: -1 })
      .exec();

    if (transactions.length < 1) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
      });
    }

    const totalTransactions = await TransactionSchema.countDocuments(query);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const todayStats = await TransactionSchema.aggregate([
      {
        $match: {
          timeStamp: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalCredited: { $sum: "$creditAmount" },
          totalDebited: { $sum: "$debitAmount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const {
      totalCredited = 0,
      totalDebited = 0,
      totalTransactions: todaysTotalTransactions = 0,
    } = todayStats[0] || {};

    return res.status(200).json({
      statusCode: 200,
      message: "Transactions fetched successfully",
      data: transactions,
      totalTransactions,
      todaysTotalTransactions,
      totalCredited,
      totalDebited,
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

exports.downloadTransactionAsCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.timeStamp = {
        $gte: new Date(startDate),
        $lt: new Date(
          new Date(endDate).setDate(new Date(endDate).getDate() + 1)
        ),
      };
    }

    const transactions = await TransactionSchema.find(query)
      .populate([{ path: "walletId" }, { path: "couponId" }])
      .sort({ timeStamp: -1 });

    if (!transactions.length) {
      return res.status(404).json({
        statusCode: 404,
        message: "No transactions found",
        data: null,
        exception: null,
      });
    }

    const fields = [
      "Transaction ID",
      "Member ID",
      "Wallet ID",
      "Coupon ID",
      "Type",
      "Payable Amount",
      "Coupon Amount",
      "Wallet Amount",
      "Status",
      "Time Stamp",
    ];

    const csv = transactions.map((transaction) => {
      return {
        "Transaction ID": transaction._id,
        "Member ID": transaction.memberId._id,
        "Wallet ID": transaction.walletId._id,
        "Coupon ID": transaction.couponId._id,
        Type: transaction.type,
        "Payable Amount": transaction.payableAmount,
        "Coupon Amount": transaction.couponAmount,
        "Wallet Amount": transaction.walletAmount,
        Status: transaction.status,
        "Time Stamp": transaction.timeStamp,
      };
    });

    const json2csvParser = new Json2csvParser({ fields });
    const csvData = json2csvParser.parse(csv);

    return res
      .setHeader("Content-Type", "text/csv")
      .setHeader("Content-Disposition", "attachment; filename=transactions.csv")
      .status(200)
      .end(csvData)
      .json({
        statusCode: 200,
        message: "Transactions fetched successfully",
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
