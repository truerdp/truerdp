import { createHmac } from "crypto"

export function verifyRazorpaySignature(input: {
  body: string | Buffer
  signature: string | undefined
  secret: string
}): boolean {
  if (!input.signature) {
    return false
  }

  const bodyBuffer =
    typeof input.body === "string" ? Buffer.from(input.body) : input.body
  const computed = createHmac("sha256", input.secret)
    .update(bodyBuffer)
    .digest("hex")

  return computed === input.signature
}

export function normalizeRazorpayEvent(payload: Record<string, unknown>): {
  eventType: "payment.succeeded" | "payment.failed"
  reference: string | null
} {
  const event = String(payload.event ?? "").toLowerCase()

  let eventType: "payment.succeeded" | "payment.failed" = "payment.failed"

  if (
    event.includes("payment.authorized") ||
    event.includes("payment.captured")
  ) {
    eventType = "payment.succeeded"
  }

  const payloadObject =
    typeof payload === "object" && payload !== null ? payload : {}
  const nestedPayload = (payloadObject as Record<string, unknown>).payload
  const nestedPayloadObject =
    typeof nestedPayload === "object" && nestedPayload !== null
      ? (nestedPayload as Record<string, unknown>)
      : {}

  const paymentData =
    nestedPayloadObject.payment ??
    (payloadObject as Record<string, unknown>).payment ??
    {}
  const paymentDataObj =
    typeof paymentData === "object" && paymentData !== null
      ? (paymentData as Record<string, unknown>)
      : {}

  const reference =
    String(
      paymentDataObj.receipt ??
        paymentDataObj.id ??
        (payloadObject as Record<string, unknown>).receipt ??
        (payloadObject as Record<string, unknown>).id ??
        ""
    ).trim() || null

  return {
    eventType,
    reference,
  }
}
