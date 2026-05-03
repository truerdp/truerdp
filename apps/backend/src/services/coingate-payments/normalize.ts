import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { transactions } from "../../schema.js"
import { pollCoinGateOrderUntilTerminal } from "./client.js"
import {
  extractCallbackPayload,
  extractStringValue,
  mapCoinGateStatusToEventType,
  objectFromUnknown,
  stringifyUnknown,
  toAmountMinor,
} from "./shared.js"

export async function verifyAndNormalizeCoinGateWebhook(input: {
  payload: unknown
  rawBody?: string | Buffer | undefined
}) {
  const callbackPayload = extractCallbackPayload(input)
  const callbackOrderId = extractStringValue(callbackPayload, [
    "id",
    "order_id",
    "orderId",
  ])
  const callbackToken = extractStringValue(callbackPayload, ["token"])

  if (!callbackOrderId) {
    throw new Error("CoinGate callback payload missing order id")
  }

  const parsedOrderId = Number.parseInt(callbackOrderId, 10)
  if (!Number.isFinite(parsedOrderId)) {
    throw new Error("CoinGate callback order id is invalid")
  }

  const order = await pollCoinGateOrderUntilTerminal(parsedOrderId)
  const orderToken = stringifyUnknown(order.token).trim() || null

  if (callbackToken && orderToken && callbackToken !== orderToken) {
    throw new Error("CoinGate callback token mismatch")
  }

  const orderReference = stringifyUnknown(order.order_id).trim() || null

  if (callbackToken && orderReference) {
    const [transaction] = await db
      .select({
        metadata: transactions.metadata,
      })
      .from(transactions)
      .where(eq(transactions.reference, orderReference))
      .limit(1)

    const txMetadata = objectFromUnknown(transaction?.metadata ?? null)
    const expectedToken = extractStringValue(txMetadata, [
      "coingate_callback_token",
    ])

    if (expectedToken && expectedToken !== callbackToken) {
      throw new Error("CoinGate callback token does not match transaction")
    }
  }

  return buildNormalizedCoinGateEvent(parsedOrderId, order)
}

export async function normalizeCoinGateOrderStatus(orderId: number) {
  const order = await pollCoinGateOrderUntilTerminal(orderId)
  return buildNormalizedCoinGateEvent(orderId, order)
}

function buildNormalizedCoinGateEvent(
  orderId: number,
  order: {
    status?: string | null
    paid_at?: string | null
    updated_at?: string | null
    created_at?: string | null
    order_id?: string | null
    price_amount?: number | string | null
    price_currency?: string | null
  }
) {
  const status = stringifyUnknown(order.status).trim().toLowerCase() || "unknown"
  const eventType = mapCoinGateStatusToEventType(status)
  const occurredAt =
    stringifyUnknown(order.paid_at).trim() ||
    stringifyUnknown(order.updated_at).trim() ||
    stringifyUnknown(order.created_at).trim() ||
    null
  const orderReference = stringifyUnknown(order.order_id).trim() || null
  const eventId = `coingate:${orderId}:${status}`

  return {
    id: eventId,
    event_id: eventId,
    type: eventType,
    status,
    reference: orderReference,
    amount: toAmountMinor(order.price_amount),
    currency: stringifyUnknown(order.price_currency).trim() || null,
    occurredAt,
    failureReason:
      eventType === "payment.failed"
        ? `CoinGate order status: ${status}`
        : null,
    metadata: {
      reference: orderReference,
    },
    data: {
      metadata: {
        reference: orderReference,
      },
      amount: toAmountMinor(order.price_amount),
      currency: stringifyUnknown(order.price_currency).trim() || null,
      status,
      occurredAt,
      failureReason:
        eventType === "payment.failed"
          ? `CoinGate order status: ${status}`
          : null,
    },
  }
}
