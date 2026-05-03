import { z } from "zod"
import { supportedPaymentMethodSchema } from "../../services/billing.js"

export const createTransactionSchema = z.object({
  orderId: z.number().int().positive(),
  method: supportedPaymentMethodSchema,
})

export const transactionParamsSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
})

export const hostedReturnSchema = z.object({
  status: z.string().trim().toLowerCase(),
  paymentId: z.string().trim().min(1).max(255).optional().nullable(),
})

export function readStringMetadata(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }

  const value = (metadata as Record<string, unknown>)[key]

  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return null
}

