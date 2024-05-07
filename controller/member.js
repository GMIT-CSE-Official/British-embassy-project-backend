const MemberSchema = require("../models/members");

exports.addMember = async (req, res) => {
  try {
    const { name, mobileNumber, image_file_path, address, expiryDate } =
      req.body;

    const member = await MemberSchema.create({
      name,
      mobileNumber,
      image_file_path,
      address,
      expiryDate,
      timeStamp: new Date(),
    });

    if (!member) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member not added",
        exception: null,
        data: null,
      });
    }

    return res.status(201).json({
      statusCode: 201,
      message: "Member added successfully",
      exception: null,
      data: member,
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

exports.deleteMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const member = await MemberSchema.findByIdAndDelete(memberId);
    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }
    return res.status(200).json({
      statusCode: 200,
      message: "Member deleted successfully",
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

exports.updateMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const {
      name,
      mobileNumber,
      image_file_path,
      address,
      expiryDate,
      timeStamp,
    } = req.body;

    const member = await MemberSchema.findByIdAndUpdate(memberId, {
      name,
      mobileNumber,
      image_file_path,
      address,
      expiryDate,
      timeStamp,
    });

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Member updated successfully",
      exception: null,
      data: member,
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

exports.getAllMembers = async (req, res) => {
  try {
    const { page, limit } = req.query;
    console.log(page, limit);
    const members = await MemberSchema.find()
      .skip((page - 1) * limit)
      .limit(limit);

    if (!members) {
      return res.status(404).json({
        statusCode: 404,
        message: "Members not found",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Members fetched successfully",
      exception: null,
      data: members,
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

exports.searchMember = async (req, res) => {
  try {
    const { key } = req.params;

    const members = await MemberSchema.find({
      $or: [
        { name: { $regex: key, $options: "i" } },
        { mobileNumber: { $regex: key, $options: "i" } },
      ],
    });

    if (!members.length > 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Members not found",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Member fetched successfully",
      exception: null,
      data: members,
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
