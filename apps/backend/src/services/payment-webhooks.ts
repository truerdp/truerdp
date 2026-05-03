import { db } from "../db.js"
import { paymentWebhookEvents } from "../schema.js"
import {
  normalizeWebhookPayload,
  webhookProviderSchema,
  type NormalizedPaymentEvent,
} from "./payment-webhooks/normalization.js"
import {
  processWebhookEvent,
  updateWebhookEventStatus,
} from "./payment-webhooks/processing.js"

type WebhookIngestResult = {
  duplicate: boolean
  eventId: string
  processingStatus: "processed" | "ignored"
}

export type { NormalizedPaymentEvent } from "./payment-webhooks/normalization.js"

export async function ingestPaymentWebhook(input: {
  provider: string
  payload: unknown
}): Promise<WebhookIngestResult> {
  const provider = webhookProviderSchema.parse(input.provider)
  const normalized = normalizeWebhookPayload(provider, input.payload)

  const [inserted] = await db
    .insert(paymentWebhookEvents)
    .values({
      provider,
      eventId: normalized.eventId,
      eventType: normalized.eventType,
      externalReference: normalized.externalReference,
      payload: input.payload,
      normalized: normalized as NormalizedPaymentEvent,
      status: "received",
    })
    .onConflictDoNothing({
      target: [paymentWebhookEvents.provider, paymentWebhookEvents.eventId],
    })
    .returning({ id: paymentWebhookEvents.id })

  if (!inserted) {
    return {
      duplicate: true,
      eventId: normalized.eventId,
      processingStatus: "ignored",
    }
  }

  try {
    const processingStatus = await processWebhookEvent({
      eventRowId: inserted.id,
      normalized,
    })

    return {
      duplicate: false,
      eventId: normalized.eventId,
      processingStatus,
    }
  } catch (error) {
    await updateWebhookEventStatus({
      eventRowId: inserted.id,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })

    throw error
  }
}

