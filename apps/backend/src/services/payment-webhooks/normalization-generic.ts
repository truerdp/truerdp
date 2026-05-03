import {
  EXTERNAL_REFERENCE_PATHS,
  INVOICE_ID_PATHS,
  TRANSACTION_ID_PATHS,
} from "./normalization-generic-paths.js"

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

export function normalizeGenericWebhook(
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
    eventType = "payment.failed"
    computedFailureReason = "__non_terminal__"
  }

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

  let externalReference: string | null = null
  for (const path of EXTERNAL_REFERENCE_PATHS) {
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

  let transactionIdFromMetadata: number | null = null
  for (const p of TRANSACTION_ID_PATHS) {
    const n = readNumberAtPath(rawPayload, p)
    if (n != null) {
      transactionIdFromMetadata = n
      break
    }
  }

  let invoiceIdFromMetadata: number | null = null
  for (const p of INVOICE_ID_PATHS) {
    const n = readNumberAtPath(rawPayload, p)
    if (n != null) {
      invoiceIdFromMetadata = n
      break
    }
  }

  const amountSource =
    rawPayload.amount ?? data?.amount ?? rawPayload.totalAmount ?? data?.totalAmount
  const amount =
    typeof amountSource === "number" && Number.isFinite(amountSource)
      ? Math.floor(amountSource)
      : null

  const currency = String(rawPayload.currency ?? data?.currency ?? "").trim() || null
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
