const { z } = require("zod");

const fileSchema = z
  .object(
    {
      originalname: z.string({
        message: "Invalid file name",
      }),
      mimetype: z
        .string({
          message: "Invalid file type",
        })
        .regex(/^image\/(jpeg|png)$/, {
          message: "Invalid file type",
        }),
      size: z
        .number({
          message: "Invalid file size",
        })
        .max(5 * 1024 * 1024, {
          message: "File size must be less than 5MB",
        }),
    },
    {
      message: "Invalid file",
    }
  )
  .optional();

const registrationSchema = z.object({
  username: z
    .string({
      message: "Username must be atleast 3 characters long",
    })
    .min(3, {
      message: "Username must be atleast 3 characters long",
    })
    .max(50, {
      message: "Username must be atmost 50 characters long",
    }),
  password: z
    .string({
      message: "Password must be atleast 6 characters long",
    })
    .min(6, {
      message: "Password must be atleast 6 characters long",
    }),
  mobileNumber: z
    .string({
      message: "Invalid mobile number",
    })
    .min(10, {
      message: "Mobile number must be atleast 10 characters long",
    })
    .max(15, {
      message: "Mobile number must be atmost 15 characters long",
    }),
  profileImage: fileSchema,
  idProof: z.object(
    {
      idType: z.string({
        message: "Please enter id type",
      }),
      idNumber: z.string({
        message: "Please enter id number",
      }),
    },
    {
      message: "Invalid id proof",
    }
  ),
});
const loginSchema = z.object({
  username: z.string({ message: "Please enter username" }),
  password: z.string({ message: "Please enter password" }),
});

const forgrtPasswordSchema = z.object({
  username: z.string({ message: "Please enter username" }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string({ message: "Please enter new password" }),
  confirmPassword: z.string({ message: "Please confirm new password" }),
});

const addMemberSchema = z.object({
  name: z.string({ message: "Please enter name" }),
  mobileNumber: z.string({ message: "Please enter mobile number" }),
  address: z.string({ message: "Please enter address" }),
  expiryDate: z.string({ message: "Please enter expiry date" }),
  image: fileSchema.optional(),
});


const changePasswordSchema = z.object({
  oldPassword: z.string({ message: "Please enter old password" }),
  newPassword: z.string({ message: "Please enter new password" }),
  confirmPassword: z.string({ message: "Please confirm new password" }),
});

module.exports = {
  registrationSchema,
  loginSchema,
  resetPasswordSchema,
  forgrtPasswordSchema,
  addMemberSchema,
  changePasswordSchema
};
