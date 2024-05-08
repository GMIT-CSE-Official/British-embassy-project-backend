const ClubAuthorization = require("../models/club-authorization");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/mail-service");
const nodeCron = require("node-cron");
const NodeCache = require("node-cache");

const cache = new NodeCache();

exports.createClub = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    const existingClub = await ClubAuthorization.findOne({ username });
    if (existingClub) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club already exists",
        data: null,
      });
    }

    const adminMails = await ClubAuthorization.find({ role: "admin" });
    if (role && role.toLowerCase() === "admin" && adminMails.length > 0) {
      for (let i = 0; i < adminMails.length; i++) {
        await sendMail(
          adminMails[i].email,
          "New Club Registration",
          `A new club with username <b>${username}</b> has registered.He/She wants to be an admin. Please verify.`
        );
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const club = new ClubAuthorization({
      username,
      password: hashedPassword,
      email,
    });

    if (role === "admin") {
      const token = jwt.sign(
        {
          username,
          role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: 1000 * 60 * 60 * 24,
        }
      );

      club.accessKey = token;
    }

    await club.save();

    for (let i = 0; i < adminMails.length; i++) {
      await sendMail(
        adminMails[i].email,
        "Access Key",
        `Access key for ${username} is ${club.accessKey}`
      );
    }

    if (!role || role.toLowerCase() !== "admin") {
      const payload = {
        club: {
          username: club.username,
          role: club.role,
        },
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: 1000 * 60 * 60 * 24,
      });
      return res
        .cookie("auth-token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 1000 * 60 * 60 * 24,
        })
        .status(201)
        .json({
          statusCode: 201,
          message: "Club created successfully",
          data: null,
          exception: null,
        });
    }

    return res.status(201).json({
      statusCode: 201,
      message: "Club created successfully please wait for verification",
      data: null,
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

exports.verifyAccessKey = async (req, res) => {
  try {
    const { OneTimeKey } = req.body;

    if (!OneTimeKey)
      return res.status(400).json({
        statusCode: 400,
        message: "One Time Key is required",
        data: null,
        error: null,
      });

    const club = await ClubAuthorization.findOne({ accessKey: OneTimeKey });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid access key",
        data: null,
        error: null,
      });
    }

    club.role = "admin";
    club.verified = true;
    await club.save();

    const payload = {
      club: {
        username: club.username,
        role: club.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 1000 * 60 * 60 * 24,
    });

    return res
      .cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(200)
      .json({
        statusCode: 200,
        message: "Access key verified successfully",
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

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const club = await ClubAuthorization.findOne({ username });

    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid username or password",
        data: null,
        error: null,
      });
    }

    const isMatch = await bcrypt.compare(password, club.password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid username or password",
        data: null,
        error: null,
      });
    }

    const payload = {
      club: {
        username: club.username,
        role: club.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: 1000 * 60 * 60 * 24,
    });

    return res
      .cookie("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(200)
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
    const { username } = req.club;
    const club = await ClubAuthorization.findOne({
      username,
    });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club not found",
        data: null,
        error: null,
      });
    }

    const { newPassword, newUsername } = req.body;
    const newToken = jwt.sign(
      {
        username: newUsername,
        role: club.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: 1000 * 60 * 60 * 24,
      }
    );

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    club.password = hashedPassword;
    club.username = newUsername;
    await club.save();

    return res
      .cookie("auth-token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(200)
      .json({
        statusCode: 200,
        message: "Club updated successfully",
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

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.club;

    const cachedClub = cache.get("club");
    if (cachedClub) {
      return res.status(200).json({
        statusCode: 200,
        message: "Club profile fetched successfully",
        data: cachedClub,
        error: null,
      });
    }

    const club = await ClubAuthorization.findOne({ username });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Club not found",
        data: null,
        error: null,
      });
    }

    cache.set("club", club);

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

    const allAdmins = await ClubAuthorization.find({
      role: "admin",
      verified: true,
    });

    for (let i = 0; i < allAdmins.length; i++) {
      await sendMail(allAdmins[i], "Reset Password", text);
    }

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
    const { token, newPassword, confirmPassword } = req.body;

    console.log(token, newPassword);

    if (!token || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        message: "Token and password are required",
        data: null,
        error: null,
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        statusCode: 400,
        message: "Passwords do not match",
        data: null,
        error: null,
      });
    }

    const hashedToken = crypto
      .createHash(process.env.HASH_ALGO)
      .update(token)
      .digest("hex");

    const club = await ClubAuthorization.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid token or token has expired",
        data: null,
        error: null,
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    club.password = hashedPassword;
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
      error: error.toString(),
    });
  }
};

nodeCron.schedule("*/30 * * * *", async () => {
  try {
    const unverifiedClubs = await ClubAuthorization.find({
      verified: false,
      role: "admin",
    });

    for (let i = 0; i < unverifiedClubs.length; i++) {
      await unverifiedClubs[i].remove();
    }
  } catch (error) {
    console.error(error);
  }
});
