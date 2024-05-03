const Operators = require("../models/operators");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Node_cache = require("node-cache");
const { sendMail } = require("../utils/mail-service");
const crypto = require("crypto");
const { log } = require("console");

const node_cache = new Node_cache();

exports.getOperatorById = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    if (node_cache.has(`user-${id}`)) {
      return res.status(200).json({
        statusCode: 200,
        message: "User found",
        data: node_cache.get(`user-${id}`),
        exception: null,
      });
    }
    const user = await Operators.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }
    node_cache.set(`user-${id}`, user);
    return res.status(200).json({
      statusCode: 200,
      message: "User found",
      data: user,
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.getAllOperators = async (req, res) => {
  try {
    const Operators = await Operators.find();
    if (!Operators) {
      return res.status(404).json({ message: "No Operators found" });
    }
    if (node_cache.has("Operators")) {
      return res.status(200).json(node_cache.get("Operators"));
    }
    node_cache.set("Operators", Operators);
    return res.status(200).json({ statusCode: 200, Operators });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
    });
  }
};

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      mobileNumber,
      address,
      expiryDate,
      profileImage,
    } = req.body;

    const user = await Operators.findOne({
      $or: [{ username, mobileNumber }],
    });

    if (user) {
      return res.status(400).json({
        statusCode: 400,
        message: "User with this id or mobile number already exists",
        exception: null,
        data: null,
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newUser = await Operators.create({
      username,
      password: hashedPassword,
      mobileNumber,
      email,
      address,
      expiryDate,
      profileImage,
    });
    const payload = {
      user: {
        id: newUser._id,
        role: newUser.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
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
        message: "User registered successfully",
        data: newUser,
        exception: null,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Operators.findOne({ username });
    console.log(user);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        data: null,
        exception: null,
      });
    }
    const isPasswordMatched = bcrypt.compareSync(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        statusCode: 400,
        message: "Credentials not matched",
        data: null,
        exception: null,
      });
    }
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
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
        message: "Login Successful",
        data: user,
        exception: null,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.updateOperator = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    const { username, email, mobileNumber, profileImage } = req.body;
    const user = await Operators.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const updatedUser = await Operators.findByIdAndUpdate(id, {
      username,
      password: hashedPassword,
      mobileNumber,
      profileImage,
      email,
    });
    return res.status(200).json({
      statusCode: 200,
      message: "User updated successfully",
      data: updatedUser,
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await Operators.findOne({ username });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }
    const resetToken = await user.getResetToken();
    Operators.findByIdAndUpdate(res);
    const resetUrl = `${process.env.FRONTEND_URL}/operator/reset-password/${resetToken}`;
    const text = `You have requested for password reset. Please click on this link to reset your password ${resetUrl}. If you have not requested for password reset, please ignore this email.`;
    await sendMail(user.email, "Password reset", text);
    return res.status(200).json({
      statusCode: 200,
      message: "Password reset link sent to your email",
      exception: null,
      data: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { token } = req.body;
  const hashedToken = crypto
    .createHash(process.env.HASH_ALGO)
    .update(token)
    .digest("hex");
  await Operators.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.status(400).json({
          statusCode: 400,
          message: "Invalid token",
          exception: null,
          data: null,
        });
      }
      const { newPassword } = req.body;
      user.password = bcrypt.hashSync(newPassword, 10);
      user.save();
      return res.status(200).json({
        statusCode: 200,
        message: "Password reset successfully",
        exception: null,
        data: null,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        statusCode: 500,
        message: "Internal server error",
        exception: error,
        data: null,
      });
    });
};

exports.logout = async (req, res) => {
  try {
    const { id } = req.user;
    node_cache.del(`user-${id}`);
    res.clearCookie("auth-token");
    return res.status(200).json({
      statusCode: 200,
      message: "Logout successful",
      data: null,
      exception: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.sendResetTokenAgain = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await Operators.findOne({
      username,
    });
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }
    const resetUrl = `${process.env.FRONTEND_URL}/operator/reset-password/${user.resetPasswordToken}`;
    const text = `You have requested for password reset. Please click on this link to reset your password ${resetUrl}. If you have not requested for password reset, please ignore this email.`;
    await sendMail(user.email, "Password reset", text);
    return res.status(200).json({
      statusCode: 200,
      message: "Password reset link sent to your email",
      exception: null,
      data: null,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};
