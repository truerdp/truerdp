import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { transactions } from "../../schema.js"
import { capturePayPalOrder } from "./orders.js"
import {
  buildPayPalCaptureEvent,
  normalizePayPalWebhookPayload,
} from "./normalize.js"
import { objectFromUnknown, readNestedString } from "./parsing.js"

function isAlreadyCapturedError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("ORDER_ALREADY_CAPTURED") ||
      error.message.includes("already captured"))
  )
}

async function findTransactionStatusByReference(reference: string | null) {
  if (!reference) {
    return null
  }

  const [transaction] = await db
    .select({
      id: transactions.id,
      status: transactions.status,
    })
    .from(transactions)
    .where(eq(transactions.reference, reference))
    .limit(1)

  return transaction ?? null
}

export async function preparePayPalWebhookForIngest(
  payload: Record<string, unknown>
) {
  const eventType = (readNestedString(payload, ["event_type"]) ?? "")
    .trim()
    .toUpperCase()

  if (eventType !== "CHECKOUT.ORDER.APPROVED") {
    return payload
  }

  const normalized = normalizePayPalWebhookPayload(payload)
  const transaction = await findTransactionStatusByReference(
    normalized.externalReference
  )

  if (!transaction) {
    return payload
  }

  if (transaction?.status === "confirmed") {
    return buildPayPalCaptureEvent({
      eventId: readNestedString(payload, ["id"]),
      orderId: readNestedString(payload, ["resource", "id"]) ?? "approved",
      capture: objectFromUnknown(payload.resource),
      reference: normalized.externalReference,
    })
  }

  if (transaction.status !== "pending") {
    return payload
  }

  const orderId = readNestedString(payload, ["resource", "id"])

  if (!orderId) {
    return payload
  }

  try {
    const capture = objectFromUnknown(await capturePayPalOrder(orderId))

    return buildPayPalCaptureEvent({
      eventId: readNestedString(payload, ["id"]),
      orderId,
      capture,
      reference: normalized.externalReference,
    })
  } catch (error) {
    if (isAlreadyCapturedError(error)) {
      return buildPayPalCaptureEvent({
        eventId: readNestedString(payload, ["id"]),
        orderId,
        capture: objectFromUnknown(payload.resource),
        reference: normalized.externalReference,
      })
    }

    throw error
  }
}
