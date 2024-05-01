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
    .string()
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
});
const loginSchema = z.object({
  username: z.string({ message: "Please enter username" }),
  password: z.string({ message: "Please enter password" }),
});

module.exports = { registrationSchema, loginSchema };
