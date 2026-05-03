import z from "zod"
import { normalizeRazorpayEvent } from "../webhook-adapters/razorpay.js"
import {
  normalizeGenericWebhook,
  type NormalizedPaymentEvent,
} from "./normalization-generic.js"

export const webhookProviderSchema = z.string().trim().min(1).max(64)

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

  if (provider === "razorpay") {
    const razorpayInfo = normalizeRazorpayEvent(payloadObj)
    const rec = payloadObj as Record<string, unknown>
    const toStringOrNull = (v: unknown): string | null => {
      if (
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean"
      ) {
        const s = String(v).trim()
        return s.length > 0 ? s : null
      }
      return null
    }

    const eventIdStr =
      toStringOrNull(rec.id) ?? toStringOrNull(rec["event_id" as string])
    if (!eventIdStr) {
      throw new Error("Unable to determine Razorpay event id")
    }

    const isObj = (v: unknown): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v)

    const payloadField = rec["payload" as string]
    const paymentField = isObj(payloadField)
      ? payloadField["payment" as string]
      : rec["payment" as string]
    const paymentDataObj: Record<string, unknown> = isObj(paymentField)
      ? (paymentField as Record<string, unknown>)
      : {}

    const amtRaw = paymentDataObj["amount"]
    const amount =
      typeof amtRaw === "number" && Number.isFinite(amtRaw)
        ? Math.floor(amtRaw)
        : null

    const currencyRaw = paymentDataObj["currency"]
    const currency =
      typeof currencyRaw === "string" && currencyRaw.trim()
        ? currencyRaw.trim()
        : "INR"

    const createdAtRaw = paymentDataObj["created_at"]
    const createdAt =
      typeof createdAtRaw === "number" ? new Date(createdAtRaw * 1000) : null

    const failureRaw = paymentDataObj["error_description"]
    const failureReason =
      typeof failureRaw === "string" && failureRaw.trim()
        ? failureRaw.trim()
        : null

    return {
      eventId: eventIdStr,
      provider,
      eventType: razorpayInfo.eventType,
      externalReference: razorpayInfo.reference,
      amount,
      currency,
      occurredAt:
        createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
      failureReason,
    }
  }

  return normalizeGenericWebhook(provider, payloadObj)
}
