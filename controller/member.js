const MemberSchema = require("../models/members.js");
const WalletSchema = require("../models/wallet.js");
const { uploadImage, deleteImage } = require("../utils/cloudinary.js");
const { MemberFilter } = require("../utils/filters");
const Cache = require("node-cache");

const cache = new Cache();

exports.addMember = async (req, res) => {
  try {
    const {
      firstName,
      lastname,
      name,
      email,
      mobileNumber,
      address,
      expiryDate,
      bloodGroup,
      organization,
      idType,
      idNumber,
      url,
      public_id,
    } = req.body;

    const mobileNumberPattern = /^[0-9]{10}$/;

    if (!mobileNumberPattern.test(mobileNumber)) {
      return res.status(400).json({
        statusCode: 400,
        message: "Invalid mobile number",
        exception: null,
        data: null,
      });
    }

    const existingUser = await MemberSchema.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({
        statusCode: 400,
        message: "Member already exists",
        exception: null,
        data: null,
      });
    }

    const allMembersCount = await MemberSchema.find().countDocuments();

    const timeStamp = new Date().toISOString().slice(0, 10);

    const memberId = `BEC${timeStamp}${name}${allMembersCount + 1}`;

    const member = new MemberSchema({
      _id: memberId.replace(/\s/g, ""),
      firstname: firstName,
      lastname: lastname,
      name,
      mobileNumber,
      address,
      email,
      idProof: {
        idType,
        idNumber,
      },
      expiryDate,
      bloodGroup,
      organization,
      image: {
        url,
        public_id,
      },
    });

    const wallet = await WalletSchema.create({
      memberId: memberId.replace(/\s/g, ""),
    });

    member.wallet = wallet._id;

    await member.save();

    if (!member || !wallet) {
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
      data: {
        member,
        wallet,
      },
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

    await WalletSchema.findOneAndDelete({ memberId: member._id });

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
    const {
      firstName,
      lastname,
      mobileNumber,
      bloodGroup,
      organization,
      address,
      email,
      expiryDate,
      timeStamp,
      idNumber,
      idType,
      username,
    } = req.body;

    const memberData = await MemberSchema.findById(memberId);

    if (!memberData) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    const member = await MemberSchema.findByIdAndUpdate(memberId, {
      firstname: firstName ? firstName : memberData.firstname,
      lastname: lastname ? lastname : memberData.lastname,
      mobileNumber: mobileNumber ? mobileNumber : memberData.mobileNumber,
      address: address ? address : memberData.address,
      idProof: {
        idType: idType ? idType : memberData.idType,
        idNumber: idNumber ? idNumber : memberData.idNumber,
      },
      expiryTime: expiryDate ? expiryDate : memberData.expiryDate,
      timeStamp: timeStamp ? timeStamp : memberData.timeStamp,
      bloodGroup: bloodGroup ? bloodGroup : memberData.bloodGroup,
      organization: organization ? organization : memberData.organization,
      username: username ? username : memberData.username,
      email: email ? email : memberData.email,
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

exports.getMembers = async (req, res) => {
  try {
    const totalMembers = await MemberSchema.find().countDocuments();
    const filter = new MemberFilter(req.query).filter().sort().paginate();
    const members = await filter.exec();
    return res.status(200).json({
      statusCode: 200,
      message: "Members found",
      totalMembers: totalMembers,
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

exports.addMemberImage = async (req, res) => {
  try {
    const file = req.files;

    if (!file || !file.image) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not uploaded",
        exception: null,
        data: null,
      });
    }

    const image = await uploadImage({
      file: file.image,
      folder: "members",
    });

    if (!image) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not uploaded",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      data: {
        image: image.url,
        public_id: image.public_id,
      },
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

exports.getMemberById = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (cache.has(memberId)) {
      return res.status(200).json({
        statusCode: 200,
        message: "Member found",
        exception: null,
        data: cache.get(memberId),
      });
    }

    const member = await MemberSchema.findById(memberId);
    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    cache.set(memberId, member);

    return res.status(200).json({
      statusCode: 200,
      message: "Member found",
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
