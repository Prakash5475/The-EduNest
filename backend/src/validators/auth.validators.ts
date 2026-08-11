import { z } from 'zod';
import { emailSchema, otpSchema, passwordSchema, phoneSchema } from './common.validators';

export const registerSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2, 'Full name is too short').max(150),
      email: emailSchema,
      phone: phoneSchema.optional(),
      password: passwordSchema,
      userType: z.enum(['school', 'dealer', 'admin', 'staff']),
      // Required when userType === 'school'
      schoolName: z.string().trim().min(2).max(200).optional(),
      schoolType: z.enum(['preschool', 'k12', 'play_school', 'montessori', 'other']).optional(),
      // Required when userType === 'dealer'
      businessName: z.string().trim().min(2).max(200).optional(),
      businessType: z.enum(['manufacturer', 'distributor', 'wholesaler', 'retailer']).optional(),
    })
    .superRefine((val, ctx) => {
      if (val.userType === 'school') {
        if (!val.schoolName) ctx.addIssue({ code: 'custom', path: ['schoolName'], message: 'School name is required' });
        if (!val.schoolType) ctx.addIssue({ code: 'custom', path: ['schoolType'], message: 'School type is required' });
      }
      if (val.userType === 'dealer') {
        if (!val.businessName) ctx.addIssue({ code: 'custom', path: ['businessName'], message: 'Business name is required' });
        if (!val.businessType) ctx.addIssue({ code: 'custom', path: ['businessType'], message: 'Business type is required' });
      }
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1).optional(),
    allDevices: z.boolean().optional().default(false),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3, 'Email or phone is required'),
    purpose: z.enum(['login', 'signup', 'password_reset', 'phone_verify', 'email_verify', 'transaction']),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3),
    purpose: z.enum(['login', 'signup', 'password_reset', 'phone_verify', 'email_verify', 'transaction']),
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
      token: z.string().min(1, 'Reset token is required'),
      password: passwordSchema,
      confirmPassword: z.string().min(1),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(1),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
