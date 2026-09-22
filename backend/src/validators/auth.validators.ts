import { z } from "zod";
import {
  emailSchema,
  otpSchema,
  passwordSchema,
  phoneSchema,
} from "./common.validators";

export const registerSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .trim()
        .min(2, "Full name is too short")
        .max(150, "Full name is too long"),

      email: emailSchema,

      phone: phoneSchema,

      password: passwordSchema,

      userType: z.enum(["school", "dealer", "admin", "staff"]),

      schoolName: z
        .string()
        .trim()
        .min(2, "School name is too short")
        .max(200, "School name is too long")
        .optional(),

      schoolType: z
        .enum([
          "preschool",
          "k12",
          "play_school",
          "montessori",
          "other",
        ])
        .optional(),

      businessName: z
        .string()
        .trim()
        .min(2, "Business name is too short")
        .max(200, "Business name is too long")
        .optional(),

      businessType: z
        .enum([
          "manufacturer",
          "distributor",
          "wholesaler",
          "retailer",
        ])
        .optional(),
    })
    .superRefine((values, context) => {
      if (values.userType === "school") {
        if (!values.schoolName?.trim()) {
          context.addIssue({
            code: "custom",
            path: ["schoolName"],
            message: "School name is required",
          });
        }

        if (!values.schoolType) {
          context.addIssue({
            code: "custom",
            path: ["schoolType"],
            message: "School type is required",
          });
        }
      }

      if (values.userType === "dealer") {
        if (!values.businessName?.trim()) {
          context.addIssue({
            code: "custom",
            path: ["businessName"],
            message: "Business name is required",
          });
        }

        if (!values.businessType) {
          context.addIssue({
            code: "custom",
            path: ["businessType"],
            message: "Business type is required",
          });
        }
      }
    }),
});

export const loginSchema = z.object({
  body: z
    .object({
      identifier: z
        .string()
        .trim()
        .min(1, "Email or phone number is required")
        .optional(),

      email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .optional(),

      password: z
        .string()
        .min(1, "Password is required"),

      rememberMe: z.boolean().optional().default(false),

      loginAs: z
        .enum(["admin", "dealer", "customer"])
        .optional()
        .default("admin"),
    })
    .superRefine((values, context) => {
      if (!values.identifier && !values.email) {
        context.addIssue({
          code: "custom",
          path: ["identifier"],
          message: "Email or phone number is required",
        });
      }
    }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, "Refresh token is required")
      .optional(),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, "Refresh token is required")
      .optional(),

    allDevices: z.boolean().optional().default(false),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(3, "Email or phone is required"),

    purpose: z.enum([
      "login",
      "signup",
      "password_reset",
      "phone_verify",
      "email_verify",
      "transaction",
    ]),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(3, "Email or phone is required"),

    purpose: z.enum([
      "login",
      "signup",
      "password_reset",
      "phone_verify",
      "email_verify",
      "transaction",
    ]),

    otp: otpSchema,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z
        .string()
        .min(1, "Reset token is required"),

      password: passwordSchema,

      confirmPassword: z
        .string()
        .min(1, "Please confirm your password"),
    })
    .refine(
      (values) => values.password === values.confirmPassword,
      "Passwords do not match",
    ),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string()
        .min(1, "Current password is required"),

      newPassword: passwordSchema,

      confirmPassword: z
        .string()
        .min(1, "Please confirm your password"),
    })
    .refine(
      (values) => values.newPassword === values.confirmPassword,
      "Passwords do not match",
    ),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z
      .string()
      .min(1, "Verification token is required"),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];