import { z } from "zod"
import { supportedPaymentMethodSchema } from "../../services/billing.js"

export const createTransactionSchema = z
  .object({
    orderId: z.number().int().positive(),
    method: supportedPaymentMethodSchema,
    txId: z.string().trim().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.method === "usdt_trc20" && !val.txId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transaction ID (TxID) is required for USDT TRC20 payments",
        path: ["txId"],
      })
    }
  })

export const transactionParamsSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
})

export function readStringMetadata(
  metadata: unknown,
  key: string
): string | null {
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
