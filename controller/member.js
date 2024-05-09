const MemberSchema = require("../models/members");
const { uploadImage, deleteImage } = require("../utils/cloudinary.js");

exports.addMember = async (req, res) => {
  try {
    const file = req.files;
    const { name, mobileNumber, address, expiryDate } = req.body;

    const existingUser = await MemberSchema.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member already exists",
        exception: null,
        data: null,
      });
    }

    if (!file || !file.image) {
      const member = await MemberSchema.create({
        name,
        mobileNumber,
        address,
        expiryDate,
      });
      return res.status(201).json({
        statusCode: 201,
        message: "Member added successfully",
        exception: null,
        data: member,
      });
    }

    const image = await uploadImage({
      file: file.image,
      folder: "members",
      name,
    });

    if (!image) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not uploaded",
        exception: null,
        data: null,
      });
    }

    if (!name || !mobileNumber || !address || !expiryDate) {
      return res.status(400).json({
        statusCode: 400,
        message: "Please fill all the fields",
        exception: null,
        data: null,
      });
    }

    const member = await MemberSchema.create({
      name,
      mobileNumber,
      image,
      address,
      expiryDate,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
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
    const { memberId } = req.params;
    const member = await MemberSchema.findByIdAndDelete(memberId);
    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }
    await deleteImage(member.image.public_id);
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
    const { memberId } = req.params;
    const file = req.files;
    const { mobileNumber, address, expiryDate, timeStamp } = req.body;

    const memberData = await MemberSchema.findById(memberId);

    if (!memberData) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    let image = memberData.image;
    if (file && file.image) {
      await deleteImage(memberData.image.public_id);
      image = await uploadImage({
        file: file.image,
        folder: "members",
        name: memberData.name,
      });
    }

    if (!image) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not uploaded",
        exception: null,
        data: null,
      });
    }

    const member = await MemberSchema.findByIdAndUpdate(memberId, {
      mobileNumber,
      address,
      expiryDate,
      timeStamp,
      image: {
        url: image.url,
        public_id: image.public_id,
      },
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

exports.updateImage = async (req, res) => {
  try {
    const { memberId } = req.params;
    const file = req.files;

    const memberData = await MemberSchema.findById(memberId);

    if (!memberData) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    let image = memberData.image;
    if (file && file.image) {
      await deleteImage(memberData.image.public_id);
      image = await uploadImage({
        file: file.image,
        folder: "members",
        name: memberData.name,
      });
    }

    if (!image) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not uploaded",
        exception: null,
        data: null,
      });
    }

    const member = await MemberSchema.findByIdAndUpdate(memberId, {
      image: {
        url: image.url,
        public_id: image.public_id,
      },
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
      message: "Image updated successfully",
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
