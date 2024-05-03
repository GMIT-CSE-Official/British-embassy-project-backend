const { token } = require("morgan");
const { z } = require("zod");

const clubRegistrationSchema = z.object({
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
});

const clubLoginSchema = z.object({
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
});

const forgetPasswordSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be atleast 3 characters long",
    })
    .max(50, {
      message: "Username must be atmost 50 characters long",
    }),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, {
    message: "Password must be atleast 6 characters long",
  }),
  token: z.string({ message: "Invalid token" }),
});

module.exports = {
  clubRegistrationSchema,
  clubLoginSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
};
