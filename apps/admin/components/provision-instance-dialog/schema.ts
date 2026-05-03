import z from "zod"

export const provisionSchema = z.object({
  serverId: z.string().min(1, "Please select a server"),
  username: z.string().optional(),
  password: z.string().optional(),
})

export type ProvisionFormValues = z.infer<typeof provisionSchema>

