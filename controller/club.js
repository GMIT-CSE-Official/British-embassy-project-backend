const ClubAuthorization = require("../models/club-authorization");
const AccessKey = require("../models/access-key");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/mail-service");
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

    const adminMails = await ClubAuthorization.find({
      role: "admin",
      verified: true,
    });
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

      const accessKey = new AccessKey({
        key: token,
        club: club._id,
      });

      await accessKey.save();

      club.accessKey = accessKey._id;
    }

    await (await club.save()).populate("accessKey");

    for (let i = 0; i < adminMails.length; i++) {
      await sendMail(
        adminMails[i].email,
        "Access Key",
        `Access key for ${username} is ${club.accessKey.key}`
      );
    }

    if (!role || role.toLowerCase() !== "admin") {
      const payload = {
        club: {
          username: club.username,
          role: club.role,
          temporary: club.temporary || false,
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
      message:
        "Club created successfully please wait for verification and ask admin for access key",
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

    const accessKey = await AccessKey.findOne({ key: OneTimeKey });

    if (!accessKey) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid access key",
        data: null,
        error: null,
      });
    }

    const club = await ClubAuthorization.findById(accessKey.club);

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
        temporary: club.temporary || false,
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
        temporary: club.temporary || false,
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

    if (cache.get(username)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Temporary password already sent",
        data: null,
        error: null,
      });
    }

    const temporaryUsername =
      crypto.randomBytes(10).toString("hex") + "@gmail.com";
    const randomPassword = crypto.randomBytes(20).toString("hex");
    const hashedPassword = bcrypt.hashSync(randomPassword, 10);
    const temporaryClub = new ClubAuthorization({
      username: temporaryUsername,
      password: hashedPassword,
      email: club.email,
      role: "admin",
      temporary: true,
    });

    await temporaryClub.save();

    const adminMails = await ClubAuthorization.find({
      role: "admin",
      verified: true,
    });
    for (let i = 0; i < adminMails.length; i++) {
      await sendMail(
        adminMails[i].email,
        "Temporary Club Credentials",
        `Temporary username: ${temporaryUsername} and password: ${randomPassword}`
      );
    }

    cache.set(username, true);

    return res.status(200).json({
      statusCode: 200,
      message: "Temporary credentials sent to all admins",
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

exports.temporaryLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const club = await ClubAuthorization.findOne({ username, temporary: true });
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
        temporary: club.temporary,
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
      error: error,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { username, password } = req.body;
    const club = await ClubAuthorization.findOne({ username });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid username",
        data: null,
        error: null,
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    club.password = hashedPassword;

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

exports.temporaryLogout = async (req, res) => {
  try {
    const { username } = req.club;
    const club = await ClubAuthorization.findOne({ username, temporary: true });
    if (!club) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid username",
        data: null,
        error: null,
      });
    }

    await ClubAuthorization.deleteOne({ username, temporary: true });

    return res.status(200).json({
      statusCode: 200,
      message: "Logged out successfully",
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

exports.logout = async (req, res) => {
  try {
    res.clearCookie("auth-token");
    return res.status(200).json({
      statusCode: 200,
      message: "Logged out successfully",
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
