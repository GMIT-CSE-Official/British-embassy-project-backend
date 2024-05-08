const { z } = require("zod");

const clubRegistrationSchema = z.object({
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
  email: z
    .string({
      message: "Invalid email",
    })
    .email({ message: "Invalid email" }),
  role: z.string().optional(),
});

const clubLoginSchema = z.object({
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
});

const forgetPasswordSchema = z.object({
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
});

const resetPasswordSchema = z.object({
  newPassword: z
    .string({
      message: "Password must be atleast 6 characters long",
    })
    .min(6, {
      message: "Password must be atleast 6 characters long",
    }),
  confirmNewPassword: z.string().min(6, {
    message: "Password must be atleast 6 characters long",
  }),
  token: z.string({ message: "Invalid token" }),
});

const verifyOtpSchema = z.object({
  otp: z
    .string({
      message: "OTP must be 6 characters long",
    })
    .length(6, { message: "Invalid OTP" }),
});

module.exports = {
  clubRegistrationSchema,
  clubLoginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
};
