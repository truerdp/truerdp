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

export function normalizeRazorpayEvent(payload: Record<string, any>): {
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

  const paymentData = payload.payload?.payment ?? payload.payment ?? {}
  const paymentDataObj =
    typeof paymentData === "object" && paymentData !== null ? paymentData : {}

  const reference =
    String(
      (paymentDataObj as any).receipt ??
        (paymentDataObj as any).id ??
        payload.receipt ??
        payload.id ??
        ""
    ).trim() || null

  return {
    eventType,
    reference,
  }
}
