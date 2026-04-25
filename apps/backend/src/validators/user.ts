import { z } from "zod"

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
})

const optionalPasswordSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return trimmed && trimmed.length > 0 ? trimmed : undefined
  })

export const updateProfileSchema = z
  .object({
    email: z.email(),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    currentPassword: optionalPasswordSchema,
    newPassword: optionalPasswordSchema,
  })
  .refine((value) => !value.newPassword || value.newPassword.length >= 8, {
    message: "New password must be at least 8 characters",
    path: ["newPassword"],
  })
  .refine((value) => !value.newPassword || !!value.currentPassword, {
    message: "Current password is required to change password",
    path: ["currentPassword"],
  })
