import type { NormalizedPaymentEvent } from "../payment-webhooks.js"
import {
  objectFromUnknown,
  readNestedString,
  toAmountMinor,
} from "./parsing.js"

function firstPurchaseUnit(payload: Record<string, unknown>) {
  const purchaseUnits = payload.purchase_units

  if (Array.isArray(purchaseUnits)) {
    return objectFromUnknown(purchaseUnits[0])
  }

  const resource = objectFromUnknown(payload.resource)
  const resourceUnits = resource.purchase_units

  if (Array.isArray(resourceUnits)) {
    return objectFromUnknown(resourceUnits[0])
  }

  return {}
}

function firstCapture(payload: Record<string, unknown>) {
  const purchaseUnit = firstPurchaseUnit(payload)
  const payments = objectFromUnknown(purchaseUnit.payments)
  const captures = payments.captures

  if (Array.isArray(captures)) {
    return objectFromUnknown(captures[0])
  }

  const resource = objectFromUnknown(payload.resource)
  return objectFromUnknown(resource)
}

function readPayPalReference(payload: Record<string, unknown>) {
  return (
    readNestedString(payload, ["resource", "custom_id"]) ??
    readNestedString(payload, ["resource", "supplementary_data", "related_ids", "order_id"]) ??
    readNestedString(payload, ["resource", "purchase_units", 0, "custom_id"]) ??
    readNestedString(payload, ["purchase_units", 0, "custom_id"]) ??
    readNestedString(firstCapture(payload), ["custom_id"])
  )
}

function readAmount(payload: Record<string, unknown>) {
  const capture = firstCapture(payload)
  const amount =
    readNestedString(capture, ["amount", "value"]) ??
    readNestedString(payload, ["resource", "amount", "value"])

  return toAmountMinor(amount)
}

function readCurrency(payload: Record<string, unknown>) {
  const capture = firstCapture(payload)

  return (
    readNestedString(capture, ["amount", "currency_code"]) ??
    readNestedString(payload, ["resource", "amount", "currency_code"])
  )
}

function readOccurredAt(payload: Record<string, unknown>) {
  const value =
    readNestedString(payload, ["create_time"]) ??
    readNestedString(payload, ["resource", "create_time"]) ??
    readNestedString(payload, ["resource", "update_time"])

  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isFailureEvent(eventType: string, status: string) {
  return (
    eventType.includes("DENIED") ||
    eventType.includes("DECLINED") ||
    eventType.includes("FAILED") ||
    eventType.includes("REVERSED") ||
    eventType.includes("REFUNDED") ||
    status === "DENIED" ||
    status === "DECLINED" ||
    status === "FAILED" ||
    status === "VOIDED"
  )
}

export function normalizePayPalWebhookPayload(
  payload: Record<string, unknown>
): NormalizedPaymentEvent {
  const eventId =
    readNestedString(payload, ["id"]) ??
    readNestedString(payload, ["resource", "id"])

  if (!eventId) {
    throw new Error("Unable to determine PayPal webhook event id")
  }

  const eventType = (
    readNestedString(payload, ["event_type"]) ??
    readNestedString(payload, ["eventType"]) ??
    ""
  )
    .trim()
    .toUpperCase()
  const status = (
    readNestedString(payload, ["resource", "status"]) ?? ""
  ).toUpperCase()

  const normalizedType =
    eventType === "PAYMENT.CAPTURE.COMPLETED" || status === "COMPLETED"
      ? "payment.succeeded"
      : isFailureEvent(eventType, status)
        ? "payment.failed"
        : "payment.failed"

  return {
    eventId,
    provider: "paypal",
    eventType: normalizedType,
    externalReference: readPayPalReference(payload),
    amount: readAmount(payload),
    currency: readCurrency(payload),
    occurredAt: readOccurredAt(payload),
    failureReason:
      normalizedType === "payment.failed"
        ? isFailureEvent(eventType, status)
          ? `PayPal event: ${eventType || status}`
          : "__non_terminal__"
        : null,
  }
}

export function buildPayPalCaptureEvent(input: {
  eventId?: string | null
  orderId: string
  capture: Record<string, unknown>
  reference: string | null
}) {
  const captureId =
    readNestedString(input.capture, ["purchase_units", 0, "payments", "captures", 0, "id"]) ??
    readNestedString(input.capture, ["id"]) ??
    input.orderId

  return {
    id: input.eventId ?? `paypal:capture:${input.orderId}:${captureId}`,
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: input.capture,
    purchase_units: [
      {
        custom_id: input.reference,
      },
    ],
  }
}
