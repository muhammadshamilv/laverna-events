import { z } from "zod";

export const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    mobile_number: z
      .string()
      .trim()
      .regex(/^\d{10,15}$/, "Mobile number must be 10-15 digits."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    password_confirm: z.string().min(8, "Please confirm your password."),
    role: z.enum(["ORGANIZER", "PHOTOGRAPHER"]),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  mobile_number: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Enter a valid mobile number."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const verifyMobileSchema = z.object({
  mobile_number: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Enter a valid mobile number."),
  code: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code."),
});

export type VerifyMobileFormValues = z.infer<typeof verifyMobileSchema>;
