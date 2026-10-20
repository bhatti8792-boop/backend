import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(254, "Email cannot exceed 254 characters")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password cannot exceed 72 characters");

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters"),

    email: emailSchema,

    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,

    password: z
      .string()
      .min(1, "Password is required")
      .max(72, "Password cannot exceed 72 characters"),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
