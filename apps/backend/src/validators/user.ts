import { z } from "zod"

export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
})
