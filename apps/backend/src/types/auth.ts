import z from "zod"

import { roleEnum } from "../schema.js"

const authUserSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(roleEnum.enumValues),
  email: z.string().email(),
})

export type AuthUser = z.infer<typeof authUserSchema>

export function parseAuthUser(value: unknown) {
  return authUserSchema.safeParse(value)
}
