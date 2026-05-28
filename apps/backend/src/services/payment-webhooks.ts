import { desc, eq, sql } from "drizzle-orm"

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

export type PaymentWebhookEventListParams = {
  page: number
  pageSize: number
  status?: "received" | "processed" | "ignored" | "failed"
  provider?: "dodo" | "coingate" | "mock"
}

export async function listPaymentWebhookEvents(
  params: PaymentWebhookEventListParams
) {
  const offset = (params.page - 1) * params.pageSize
  const filters = [
    params.status
      ? sql`${paymentWebhookEvents.status} = ${params.status}`
      : undefined,
    params.provider
      ? sql`${paymentWebhookEvents.provider} = ${params.provider}`
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter))
  const whereClause =
    filters.length > 0 ? sql.join(filters, sql` and `) : undefined

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentWebhookEvents)
    .where(whereClause)

  const items = await db
    .select({
      id: paymentWebhookEvents.id,
      provider: paymentWebhookEvents.provider,
      eventId: paymentWebhookEvents.eventId,
      eventType: paymentWebhookEvents.eventType,
      externalReference: paymentWebhookEvents.externalReference,
      status: paymentWebhookEvents.status,
      errorMessage: paymentWebhookEvents.errorMessage,
      processedAt: paymentWebhookEvents.processedAt,
      createdAt: paymentWebhookEvents.createdAt,
    })
    .from(paymentWebhookEvents)
    .where(whereClause)
    .orderBy(desc(paymentWebhookEvents.createdAt))
    .limit(params.pageSize)
    .offset(offset)

  const totalCount = totalRows[0]?.count ?? 0

  return {
    items,
    pagination: {
      page: params.page,
      pageSize: params.pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / params.pageSize),
    },
  }
}

export async function reprocessPaymentWebhookEvent(eventRowId: number) {
  const [event] = await db
    .select({
      id: paymentWebhookEvents.id,
      provider: paymentWebhookEvents.provider,
      payload: paymentWebhookEvents.payload,
      normalized: paymentWebhookEvents.normalized,
    })
    .from(paymentWebhookEvents)
    .where(eq(paymentWebhookEvents.id, eventRowId))
    .limit(1)

  if (!event) {
    return null
  }

  const normalized =
    event.normalized && typeof event.normalized === "object"
      ? (event.normalized as NormalizedPaymentEvent)
      : normalizeWebhookPayload(event.provider, event.payload)

  await db
    .update(paymentWebhookEvents)
    .set({
      status: "received",
      errorMessage: null,
      normalized,
      processedAt: null,
    })
    .where(eq(paymentWebhookEvents.id, event.id))

  try {
    const processingStatus = await processWebhookEvent({
      eventRowId: event.id,
      normalized,
    })

    return {
      eventId: normalized.eventId,
      processingStatus,
    }
  } catch (error) {
    await updateWebhookEventStatus({
      eventRowId: event.id,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })

    throw error
  }
}

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
