import { eq } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import {
  invoices,
  orders,
  paymentWebhookEvents,
  transactions,
} from "../schema.js"
import { BillingError, confirmPendingTransaction } from "./billing.js"
import { normalizeRazorpayEvent } from "./webhook-adapters/razorpay.js"

const webhookProviderSchema = z.string().trim().min(1).max(64)

const mockWebhookSchema = z.object({
  eventId: z.string().trim().min(1),
  eventType: z.enum(["payment.succeeded", "payment.failed"]),
  reference: z.string().trim().min(1).optional(),
  amount: z.number().int().nonnegative().optional(),
  currency: z.string().trim().min(1).optional(),
  occurredAt: z.string().datetime().optional(),
  failureReason: z.string().trim().min(1).optional(),
})

export type NormalizedPaymentEvent = {
  eventId: string
  provider: string
  eventType: "payment.succeeded" | "payment.failed"
  externalReference: string | null
  transactionIdFromMetadata?: number | null
  invoiceIdFromMetadata?: number | null
  amount: number | null
  currency: string | null
  occurredAt: Date | null
  failureReason: string | null
}

type WebhookIngestResult = {
  duplicate: boolean
  eventId: string
  processingStatus: "processed" | "ignored"
}

function extractNestedObject(
  payload: Record<string, unknown>,
  key: string
): Record<string, unknown> | null {
  const value = payload[key]

  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

function normalizeGenericWebhook(
  provider: string,
  rawPayload: Record<string, unknown>
): NormalizedPaymentEvent {
  const data = extractNestedObject(rawPayload, "data")

  const eventId =
    String(
      rawPayload.id ??
        rawPayload.eventId ??
        rawPayload.event_id ??
        data?.id ??
        data?.eventId ??
        data?.event_id ??
        ""
    ).trim() || null

  if (!eventId) {
    throw new Error("Unable to determine webhook event id")
  }

  const rawEventType = String(
    rawPayload.type ?? rawPayload.eventType ?? rawPayload.event ?? ""
  )
    .toLowerCase()
    .trim()

  const rawStatus = String(
    (rawPayload as Record<string, unknown>).status ??
      (data as Record<string, unknown> | null)?.status ??
      ""
  )
    .toLowerCase()
    .trim()

  const isSuccess =
    rawEventType === "payment.succeeded" ||
    rawEventType.endsWith(".succeeded") ||
    rawEventType.includes("succeed") ||
    rawEventType.includes("success") ||
    rawEventType.includes("paid") ||
    rawEventType.includes("captured") ||
    rawEventType.includes("completed") ||
    rawEventType.includes("authorized") ||
    rawStatus === "succeeded" ||
    rawStatus === "success" ||
    rawStatus === "paid"

  const isFailure =
    rawEventType.includes("fail") ||
    rawEventType.includes("failed") ||
    rawEventType.includes("declin") ||
    rawEventType.includes("invalid") ||
    rawEventType.includes("expire") ||
    rawEventType.includes("cancel") ||
    rawEventType.includes("error") ||
    rawEventType.includes("refunded") ||
    rawStatus === "failed" ||
    rawStatus === "cancelled" ||
    rawStatus === "declined" ||
    rawStatus === "canceled" ||
    rawStatus === "invalid" ||
    rawStatus === "expired"

  let eventType: "payment.succeeded" | "payment.failed"
  let computedFailureReason: string | null =
    String(
      (rawPayload as Record<string, unknown>).failureReason ??
        (data as Record<string, unknown> | null)?.failureReason ??
        ""
    ).trim() || null

  if (isSuccess) {
    eventType = "payment.succeeded"
  } else if (isFailure) {
    eventType = "payment.failed"
  } else {
    // Non-terminal/unknown state like "payment.processing" → ignore later
    eventType = "payment.failed"
    computedFailureReason = "__non_terminal__"
  }

  // Resolve external reference from multiple common locations (flat, data.*, and nested metadata)
  function readStringAtPath(obj: unknown, path: string[]): string | null {
    let cur: unknown = obj
    for (const key of path) {
      if (!cur || typeof cur !== "object" || Array.isArray(cur)) return null
      const rec = cur as Record<string, unknown>
      cur = rec[key]
    }
    if (typeof cur === "string") {
      const s = cur.trim()
      return s.length > 0 ? s : null
    }
    return null
  }

  const candidatePaths: string[][] = [
    ["reference"],
    ["transactionReference"],
    ["tx_ref"],
    ["data", "reference"],
    ["data", "transactionReference"],
    ["data", "tx_ref"],
    ["metadata", "reference"],
    ["data", "metadata", "reference"],
    ["data", "payment", "metadata", "reference"],
    ["data", "invoice", "metadata", "reference"],
    // Fallbacks to alternate keys often used for reconciliation
    ["metadata", "transaction_id"],
    ["data", "metadata", "transaction_id"],
    ["data", "payment", "metadata", "transaction_id"],
    ["data", "invoice", "metadata", "transaction_id"],
    ["metadata", "reference_id"],
    ["metadata", "referenceId"],
    ["data", "metadata", "reference_id"],
    ["data", "metadata", "referenceId"],
  ]

  let externalReference: string | null = null
  for (const path of candidatePaths) {
    const v = readStringAtPath(rawPayload, path)
    if (v) {
      externalReference = v
      break
    }
  }

  function readNumberAtPath(obj: unknown, path: string[]): number | null {
    const s = readStringAtPath(obj, path)
    if (!s) return null
    const n = Number.parseInt(s, 10)
    return Number.isFinite(n) ? n : null
  }

  const txIdPaths: string[][] = [
    ["metadata", "transaction_id"],
    ["data", "metadata", "transaction_id"],
    ["data", "payment", "metadata", "transaction_id"],
    ["data", "invoice", "metadata", "transaction_id"],
  ]
  const invIdPaths: string[][] = [
    ["metadata", "invoice_id"],
    ["data", "metadata", "invoice_id"],
    ["data", "payment", "metadata", "invoice_id"],
    ["data", "invoice", "metadata", "invoice_id"],
  ]

  let transactionIdFromMetadata: number | null = null
  for (const p of txIdPaths) {
    const n = readNumberAtPath(rawPayload, p)
    if (n != null) {
      transactionIdFromMetadata = n
      break
    }
  }

  let invoiceIdFromMetadata: number | null = null
  for (const p of invIdPaths) {
    const n = readNumberAtPath(rawPayload, p)
    if (n != null) {
      invoiceIdFromMetadata = n
      break
    }
  }

  const amountSource =
    rawPayload.amount ??
    data?.amount ??
    rawPayload.totalAmount ??
    data?.totalAmount
  const amount =
    typeof amountSource === "number" && Number.isFinite(amountSource)
      ? Math.floor(amountSource)
      : null

  const currency =
    String(rawPayload.currency ?? data?.currency ?? "").trim() || null

  const occurredAtValue =
    rawPayload.occurredAt ??
    rawPayload.createdAt ??
    rawPayload.timestamp ??
    data?.occurredAt ??
    data?.createdAt ??
    data?.timestamp

  const occurredAt =
    typeof occurredAtValue === "string" && occurredAtValue.trim().length > 0
      ? new Date(occurredAtValue)
      : null

  return {
    eventId,
    provider,
    eventType,
    externalReference,
    transactionIdFromMetadata,
    invoiceIdFromMetadata,
    amount,
    currency,
    occurredAt:
      occurredAt && !Number.isNaN(occurredAt.getTime()) ? occurredAt : null,
    failureReason: computedFailureReason,
  }
}

function normalizeWebhookPayload(
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
    const eventId = eventIdStr

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
      eventId,
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

async function updateWebhookEventStatus(input: {
  eventRowId: number
  status: "processed" | "ignored" | "failed"
  errorMessage?: string | null
}) {
  await db
    .update(paymentWebhookEvents)
    .set({
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      processedAt: new Date(),
    })
    .where(eq(paymentWebhookEvents.id, input.eventRowId))
}

async function markPendingTransactionAsFailed(input: {
  transactionId: number
  invoiceId: number
  reason: string
}) {
  await db.transaction(async (tx) => {
    const [invoiceRecord] = await tx
      .select({ orderId: invoices.orderId })
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .limit(1)

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: input.reason,
      })
      .where(eq(transactions.id, input.transactionId))

    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(eq(invoices.id, input.invoiceId))

    if (invoiceRecord?.orderId) {
      await tx
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, invoiceRecord.orderId))
    }
  })
}

async function processWebhookEvent(input: {
  eventRowId: number
  normalized: NormalizedPaymentEvent
}): Promise<"processed" | "ignored"> {
  const { normalized } = input

  if (
    !normalized.externalReference &&
    normalized.transactionIdFromMetadata == null &&
    normalized.invoiceIdFromMetadata == null
  ) {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
    })

    return "ignored"
  }

  let transaction = (
    await db
      .select({
        id: transactions.id,
        status: transactions.status,
        invoiceId: transactions.invoiceId,
      })
      .from(transactions)
      .where(eq(transactions.reference, normalized.externalReference ?? ""))
      .limit(1)
  )[0]

  if (!transaction && normalized.transactionIdFromMetadata != null) {
    transaction = (
      await db
        .select({
          id: transactions.id,
          status: transactions.status,
          invoiceId: transactions.invoiceId,
        })
        .from(transactions)
        .where(eq(transactions.id, normalized.transactionIdFromMetadata))
        .limit(1)
    )[0]
  }

  if (!transaction && normalized.invoiceIdFromMetadata != null) {
    transaction = (
      await db
        .select({
          id: transactions.id,
          status: transactions.status,
          invoiceId: transactions.invoiceId,
        })
        .from(transactions)
        .where(eq(transactions.invoiceId, normalized.invoiceIdFromMetadata))
        .limit(1)
    )[0]
  }

  if (!transaction) {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
      errorMessage: "No matching transaction for webhook reference",
    })

    return "ignored"
  }

  if (normalized.eventType === "payment.succeeded") {
    if (transaction.status === "pending") {
      try {
        await confirmPendingTransaction(transaction.id)
      } catch (error) {
        if (!(error instanceof BillingError) || error.statusCode !== 400) {
          throw error
        }
      }
    }

    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "processed",
    })

    return "processed"
  }

  // Ignore non-terminal/unknown events (e.g., "payment.processing")
  if (normalized.failureReason === "__non_terminal__") {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
    })
    return "ignored"
  }

  if (transaction.status === "pending") {
    await markPendingTransactionAsFailed({
      transactionId: transaction.id,
      invoiceId: transaction.invoiceId,
      reason: normalized.failureReason ?? "Payment failed via webhook",
    })
  }

  await updateWebhookEventStatus({
    eventRowId: input.eventRowId,
    status: "processed",
  })

  return "processed"
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
      normalized,
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
