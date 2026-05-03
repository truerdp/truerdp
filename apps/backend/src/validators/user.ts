import { z } from "zod"

export const updateProfileSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
})
