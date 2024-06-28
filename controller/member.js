const QRCode = require("qrcode");
const MemberSchema = require("../models/members.js");
const WalletSchema = require("../models/wallet.js");
const { uploadImage, deleteImage } = require("../utils/cloudinary.js");
const { MemberFilter } = require("../utils/filters");
const Cache = require("node-cache");
const pdf = require("html-pdf");
const { sendMail } = require("../utils/mail-service.js");

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

    const shortDate = new Date().toISOString().slice(2, 10).replace(/-/g, "");

    const memberId = `BCK${shortDate}${allMembersCount + 1}`;

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
      timeStamp: new Date(),
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

    cache.del(memberId);

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

    cache.del(memberId, member);

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

const generateQRCode = async (frontendUrl) => {
  try {
    const qrCode = await QRCode.toDataURL(frontendUrl);
    return qrCode;
  } catch (error) {
    console.log(error);
    return null;
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { memberId } = req.params;
    const randomSecret = Math.random().toString(36).substring(7);
    const frontendUrl = `${process.env.FRONTEND_URL}/member/data/${randomSecret}/${memberId}`;

    const member = await MemberSchema.findById(memberId).populate("wallet");
    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }
    const qrCode = await generateQRCode(frontendUrl);
    return res.status(200).json({
      statusCode: 200,
      message: "Member found",
      exception: null,
      data: member,
      qrCode: qrCode,
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

exports.downloadCardPdf = async (req, res) => {
  try {
    const { frontImage: frontimage, backImage: backimage } = req.body;

    if (!frontimage || !backimage) {
      return res.status(400).json({
        statusCode: 400,
        message: "Image not provided",
        data: null,
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Virtual Card</title>
        <style>
          body, html {
            height: 100%;
            margin: 0;
            background-color: #f3f4f6;
          }
          .card-container {
            width: 100%;
            max-width: 400px;
            margin: 20px auto;
            padding: 20px;
            background: white;
            border-radius: 8px;
            text-align: center;
          }
          img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid #e1e1e1;
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <img src="${frontimage}" alt="Virtual Card Front"/>
        </div>
        <div class="card-container">
          <img src="${backimage}" alt="Virtual Card Back"/>
        </div>
      </body>
      </html>
    `;

    pdf.create(htmlContent).toBuffer((err, buffer) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          statusCode: 500,
          message: "Failed to create PDF",
          data: null,
        });
      }

      try {
        res.writeHead(200, {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=virtual-card.pdf",
        });
        res.end(buffer);
      } catch (writeError) {
        console.error("Failed to write response:", writeError);
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Failed to process request",
      data: null,
    });
  }
};
exports.sendCardAsEmail = async (req, res) => {
  try {
    const { email, frontImage, backImage } = req.body;
    if (!email || !frontImage || !backImage) {
      return res.status(400).json({
        statusCode: 400,
        message: "Email or image not provided",
        exception: null,
        data: null,
      });
    }

    const member = await MemberSchema.findOne({
      email: email,
    });

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        message: "Member not found",
        exception: null,
        data: null,
      });
    }

    const attachment = [
      {
        filename: "frontImage.png",
        content: frontImage.split("base64,")[1],
        encoding: "base64",
        cid: "frontImage",
      },
      {
        filename: "backImage.png",
        content: backImage.split("base64,")[1],
        encoding: "base64",
        cid: "backImage",
      },
    ];

    const htmlContent = `
      <html>
        <body>
          <h1>Virtual Card</h1>
          <div>
            <span>${member.firstname}</span> 
            <span>${member.lastname}</span>
          </div>
          <img src="cid:frontImage" alt="Front Image"
            style="margin-top: 20px; width: 100%; max-width:360px; height: auto; border-radius: 8px; border: 1px solid #e1e1e1; margin-left: 20px;"
           />
          <img src="cid:backImage" alt="Back Image" 
           style="margin-top: 20px; width: 100%; max-width:360px; height: auto; border-radius: 8px; border: 1px solid #e1e1e1; margin-left: 20px;"
          />
        </body>
      </html>
    `;

    const response = await sendMail(
      email,
      "Virtual Card",
      "Virtual Card",
      htmlContent,
      attachment
    );

    if (!response) {
      return res.status(400).json({
        statusCode: 400,
        message: "Failed to send email",
        exception: null,
        data: null,
      });
    }

    return res.status(200).json({
      statusCode: 200,
      message: "Email sent successfully",
      exception: null,
      data: response,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 500,
      message: "Failed to send email",
      exception: error,
      data: null,
    });
  }
};
