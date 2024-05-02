const ClubAuthorization = require("../models/club-authorization");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/mail-service");
const { error } = require("console");
const clubAuthorization = require("../models/club-authorization");

exports.createClub = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingClub = await ClubAuthorization.findOne({ username });
    if (existingClub) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club already exists",
        data: null,
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = new ClubAuthorization({
      username,
      password: hashedPassword,
      accessKey: null,
    });

    const jwtToken = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 1000 * 60 * 60 * 24 * 7,
      }
    );

    user.accessKey = jwtToken;
    await user.save();

    return res
      .cookie("auth-token", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(201)
      .json({
        statusCode: 201,
        message: "Club created successfully",
        data: user,
        exception: null,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error || null,
      data: null,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const club = await ClubAuthorization.findOne({ username });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid credentials",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, club.password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid credentials",
        data: null,
      });
    }

    return res
      .status(200)
      .cookie("auth-token", club.accessKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .json({
        statusCode: 200,
        message: "Login successful",
        data: club,
        error: null,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
    });
  }
};

exports.updateClub = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    ClubAuthorization.findOneAndUpdate(
      { username },
      { password: hashedPassword }
    );

    return res.status(200).json({
      statusCode: 200,
      message: "Club updated successfully",
      data: club,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const club = await ClubAuthorization.findOne({ username });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club not found",
        data: null,
        error: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Club profile fetched successfully",
      data: club,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
      error: error,
    });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { username } = req.body;
    const club = await ClubAuthorization.findOne({ username });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club not found",
        data: null,
        error: null,
      });
    }

    const resetToken = await club.getResetToken();

    const url = `${process.env.FRONTEND_URL}/club/reset-password/${resetToken}`;

    const text = `You have requested for password reset. Please click on this link to reset your password ${url}. If you have not requested for password reset, please ignore this email.`;

    await sendMail(process.env.CLUB_EMAIL, "Reset Password", text);
    console.log(resetToken);

    return res.status(200).json({
      statusCode: 200,
      message: "Reset password token generated successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
      error: error,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedPassword = crypto
      .createHash(process.env.HASH_ALGO)
      .update(token)
      .digest("hex");

    const club = await ClubAuthorization.findOne({
      resetPasswordToken: hashedPassword,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid token",
        data: null,
        error: null,
      });
    }

    const salt = await bcrypt.genSalt(10);
    club.password = bcrypt.hashSync(password, 10);
    club.resetPasswordToken = null;
    club.resetPasswordTokenExpires = null;
    await club.save();

    return res.status(200).json({
      statusCode: 200,
      message: "Password reset successfully",
      data: null,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      data: null,
      error: error,
    });
  }
};
