import { getEnv } from "./config.js"
import { paypalRequest } from "./client.js"
import {
  extractPayPalEventPayload,
  extractRawBodyText,
  objectFromUnknown,
} from "./parsing.js"
import type { PayPalWebhookVerificationResponse } from "./types.js"

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = headers[key] ?? headers[key.toLowerCase()]

  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

export async function verifyAndUnwrapPayPalWebhook(input: {
  payload: unknown
  rawBody?: string | Buffer | undefined
  headers: Record<string, string | string[] | undefined>
}) {
  const rawText = extractRawBodyText(input.rawBody)
  const webhookEvent = extractPayPalEventPayload({
    payload: input.payload,
    rawBody: rawText,
  })

  if (Object.keys(webhookEvent).length === 0) {
    throw new Error("PayPal webhook payload is empty")
  }

  const response = await paypalRequest<PayPalWebhookVerificationResponse>({
    path: "/v1/notifications/verify-webhook-signature",
    method: "POST",
    body: {
      auth_algo: readHeader(input.headers, "paypal-auth-algo"),
      cert_url: readHeader(input.headers, "paypal-cert-url"),
      transmission_id: readHeader(input.headers, "paypal-transmission-id"),
      transmission_sig: readHeader(input.headers, "paypal-transmission-sig"),
      transmission_time: readHeader(input.headers, "paypal-transmission-time"),
      webhook_id: getEnv("PAYPAL_WEBHOOK_ID"),
      webhook_event: objectFromUnknown(webhookEvent),
    },
  })

  if (response.verification_status !== "SUCCESS") {
    throw new Error("Invalid PayPal webhook signature")
  }

  return webhookEvent
}
