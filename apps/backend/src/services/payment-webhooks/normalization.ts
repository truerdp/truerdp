import z from "zod"
import {
  normalizeGenericWebhook,
  type NormalizedPaymentEvent,
} from "./normalization-generic.js"
import { normalizePayPalWebhookPayload } from "../paypal-payments.js"

export const webhookProviderSchema = z.enum([
  "dodo",
  "coingate",
  "paypal",
  "mock",
])

const mockWebhookSchema = z.object({
  eventId: z.string().trim().min(1),
  eventType: z.enum(["payment.succeeded", "payment.failed"]),
  reference: z.string().trim().min(1).optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().trim().min(1).optional(),
  occurredAt: z.string().datetime().optional(),
  failureReason: z.string().trim().min(1).optional(),
})

export type { NormalizedPaymentEvent } from "./normalization-generic.js"

export function normalizeWebhookPayload(
  provider: string,
  rawPayload: unknown
): NormalizedPaymentEvent {
  if (provider === "mock") {
    const payload = mockWebhookSchema.parse(rawPayload)

    return {
      eventId: payload.eventId,
      provider,
      eventType: payload.eventType,
      externalReference: payload.reference ?? null,
      amount: payload.amount ?? null,
      currency: payload.currency ?? null,
      occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : null,
      failureReason: payload.failureReason ?? null,
    }
  }

  if (
    !rawPayload ||
    typeof rawPayload !== "object" ||
    Array.isArray(rawPayload)
  ) {
    throw new Error("Invalid webhook payload")
  }

  const payloadObj = rawPayload as Record<string, unknown>

  if (provider === "paypal") {
    return normalizePayPalWebhookPayload(payloadObj)
  }

  return normalizeGenericWebhook(provider, payloadObj)
}
