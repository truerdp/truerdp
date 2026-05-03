import z from "zod"

export const serverFormSchema = z.object({
  provider: z.string().trim().min(1, "Provider is required"),
  externalId: z.string().trim().optional(),
  ipAddress: z.string().trim().min(1, "IP address is required"),
  cpu: z.number().int().positive("CPU must be greater than 0"),
  ram: z.number().int().positive("RAM must be greater than 0"),
  storage: z.number().int().positive("Storage must be greater than 0"),
  status: z.enum(["available", "assigned", "cleaning", "retired"]),
})

export type ServerFormValues = z.infer<typeof serverFormSchema>

export const defaultServerFormValues: ServerFormValues = {
  provider: "manual",
  externalId: "",
  ipAddress: "",
  cpu: 2,
  ram: 4,
  storage: 80,
  status: "available",
}

