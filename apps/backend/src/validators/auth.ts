import { z } from "zod"

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export const forgotPasswordSchema = z.object({
  email: z.email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32),
  password: z.string().min(8),
})
