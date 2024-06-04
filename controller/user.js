const bcrypt = require("bcrypt");
const Node_cache = require("node-cache");
const { sendMail } = require("../utils/mail-service");
const crypto = require("crypto");
const { uploadImage } = require("../utils/cloudinary");
const ClubAuthorization = require("../models/club-authorization");
const Operators = require("../models/operators");

const node_cache = new Node_cache();

const encryptPayload = async (payload) => {
  const algorithm = "aes-256-cbc";
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(process.env.ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
    key: process.env.ENCRYPTION_KEY,
  };
};

exports.decryptPayload = async (token) => {
  const algorithm = "aes-256-cbc";
  const { iv, encryptedData } = token;

  const ivBuffer = Buffer.from(iv, "hex");
  const encryptedDataBuffer = Buffer.from(encryptedData, "hex");
  const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, "hex");

  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, ivBuffer);

  let decrypted = decipher.update(encryptedDataBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
};

exports.getCurrentUser = async (req, res) => {
  try {
    const { username } = req.club;

    if (!username) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }

    const admin = await ClubAuthorization.findOne({
      username,
      role: "admin",
      verified: true,
    });

    if (admin) {
      const club = await ClubAuthorization.findOne({
        username,
        role: "admin",
        verified: true,
      }).select("-password");
      if (!club) {
        return res.status(404).json({
          statusCode: 404,
          message: "Club not found",
          exception: null,
          data: null,
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: "Club found",
        data: club,
        exception: null,
      });
    }

    const temporaryAdmin = await ClubAuthorization.findOne({
      username,
      role: "admin",
      verified: false,
      temporary: true,
    });

    if (temporaryAdmin) {
      const club = await ClubAuthorization.findOne({
        username,
        role: "admin",
        verified: false,
        temporary: true,
      }).select("-password");
      if (!club) {
        return res.status(404).json({
          statusCode: 404,
          message: "Club not found",
          exception: null,
          data: null,
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: "Club found",
        data: club,
        exception: null,
      });
    }

    const token = req.cookies["user-token"];
    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: "Unauthorized access",
        exception: null,
        data: null,
      });
    }
    const decryptedToken = await this.decryptPayload(token);
    const { user } = JSON.parse(decryptedToken);
    const operator = await Operators.findById(user.id).select("-password");

    if (!operator) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "User found",
      data: operator,
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
    const operators = await Operators.find();
    if (!operators) {
      return res.status(404).json({ message: "No Operators found" });
    }
    if (node_cache.has("Operators")) {
      return res.status(200).json(node_cache.get("Operators"));
    }
    node_cache.set("Operators", operators);
    return res.status(200).json({ statusCode: 200, operators });
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
      idProof: { idType, idNumber },
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
      idProof: {
        idType,
        idNumber,
      },
    });

    const payload = {
      user: {
        id: newUser._id,
        role: newUser.role,
      },
    };

    const token = await encryptPayload(payload);

    return res
      .cookie("user-token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
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
    await Operators.deleteOne({
      username: req.body.username,
      mobileNumber: req.body.mobileNumber,
    });
    return res.status(500).json({
      statusCode: 500,
      message: "Internal server error",
      exception: error,
      data: null,
    });
  }
};

exports.changePassword = async (req, res) => {
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
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const user = await Operators.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }
    const isPasswordMatched = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        statusCode: 400,
        message: "Old password does not match",
        exception: null,
        data: null,
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        statusCode: 400,
        message: "Password does not match",
        exception: null,
        data: null,
      });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await Operators.findByIdAndUpdate(id, {
      password: hashedPassword,
    });
    return res.status(200).json({
      statusCode: 200,
      message: "Password changed successfully",
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

exports.updateOperatorImage = async (req, res) => {
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
    const user = await Operators.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
        exception: null,
        data: null,
      });
    }
    const file = req.files;
    if (!file) {
      return res.status(400).json({
        statusCode: 400,
        message: "No file uploaded",
        exception: null,
        data: null,
      });
    }
    const { url, public_id } = await uploadImage({
      file: file.image,
      folder: "operators",
      name: user._id,
    });
    user.profileImage = {
      url,
      public_id,
    };
    await user.save();
    return res.status(200).json({
      statusCode: 200,
      message: "Image uploaded successfully",
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

exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await Operators.findOne({ username });
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
    const token = await encryptPayload(payload);

    return res
      .cookie("user-token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
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
    const { email, mobileNumber, idType, idNumber, address } = req.body;
    const user = await Operators.findById(id);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        message: "User not found",
      });
    }
    const hashedPassword = null;
    if (req.body.password) {
      hashedPassword = bcrypt.hashSync(req.body.password, 10);
    }

    const updatedUser = await Operators.findByIdAndUpdate(id, {
      password: hashedPassword ? hashedPassword : user.password,
      mobileNumber,
      email,
      address,
      idProof: {
        idType,
        idNumber,
      },
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
      link: resetUrl,
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
  const { token } = req.params;
  if (!token) {
    return res.status(400).json({
      statusCode: 400,
      message: "Invalid token",
      exception: null,
      data: null,
    });
  }
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
      const { newPassword, confirmPassword } = req.body;
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          statusCode: 400,
          message: "Password does not match",
          exception: null,
          data: null,
        });
      }
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

exports.logout = async (req, res) => {
  try {
    const cookies = ["user-token", "auth-token"];
    cookies.forEach((cookie) => {
      res.clearCookie(cookie, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
    });
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
      exception: { error },
      data: null,
    });
  }
};
