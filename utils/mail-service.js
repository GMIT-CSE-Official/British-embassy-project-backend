const nodemailer = require("nodemailer");

exports.sendMail = async (to, subject, text, html, attachment) => {
  try {
    if (!to) {
      throw new Error("Email address is required");
    }

    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      service: process.env.EMAIL_SERVICE,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const info = await transport.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text,
      html,
      attachments: attachment,
    });
    return info;
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};
