import { z } from "zod"

const optionalBillingFieldSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  })

const billingDetailsSchema = z.object({
  phone: z.string().trim().min(1),
  companyName: optionalBillingFieldSchema,
  taxId: optionalBillingFieldSchema,
  addressLine1: z.string().trim().min(1),
  addressLine2: optionalBillingFieldSchema,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
  country: z.string().trim().min(1),
})

export const updateProfileSchema = z.object({
  email: z.email(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  billingDetails: billingDetailsSchema.optional(),
})
