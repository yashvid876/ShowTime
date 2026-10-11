import { z } from "zod";

export const Role = z.enum(["patron", "partner", "admin"]);

export const User = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  role: Role,
});

/** Min 8 chars, at least one letter and one number (contract §1 rules). */
export const Password = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const RegisterBody = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^\+?[1-9]\d{9,14}$/, "Enter a valid phone number"),
  password: Password,
});

export const LoginBody = z.object({
  identifier: z.string().trim().min(3, "Enter your email or phone number"),
  password: z.string().min(1, "Enter your password"),
});

export const VerifyOtpBody = z.object({
  userId: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const ForgotPasswordBody = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const ResetPasswordBody = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: Password,
});
