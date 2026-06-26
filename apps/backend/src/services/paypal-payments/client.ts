import { getEnv, getPayPalApiBaseUrl } from "./config.js"
import { objectFromUnknown, safeJsonParse } from "./parsing.js"

let cachedAccessToken: {
  token: string
  expiresAt: number
} | null = null

async function getPayPalAccessToken() {
  const now = Date.now()

  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.token
  }

  const clientId = getEnv("PAYPAL_CLIENT_ID")
  const clientSecret = getEnv("PAYPAL_CLIENT_SECRET")
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  )

  const response = await fetch(`${getPayPalApiBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  const rawText = await response.text()
  const parsedBody = objectFromUnknown(safeJsonParse(rawText))

  if (!response.ok) {
    const message =
      typeof parsedBody.error_description === "string"
        ? parsedBody.error_description
        : rawText || `HTTP ${response.status}`

    throw new Error(`PayPal auth failed (${response.status}): ${message}`)
  }

  const token =
    typeof parsedBody.access_token === "string"
      ? parsedBody.access_token.trim()
      : ""
  const expiresIn =
    typeof parsedBody.expires_in === "number" ? parsedBody.expires_in : 0

  if (!token) {
    throw new Error("PayPal auth response missing access token")
  }

  cachedAccessToken = {
    token,
    expiresAt: now + Math.max(0, expiresIn) * 1000,
  }

  return token
}

export async function paypalRequest<T>(input: {
  path: string
  method?: "GET" | "POST"
  body?: Record<string, unknown> | null
}) {
  const token = await getPayPalAccessToken()
  const response = await fetch(`${getPayPalApiBaseUrl()}${input.path}`, {
    method: input.method ?? (input.body ? "POST" : "GET"),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  })

  const rawText = await response.text()
  const parsedBody = safeJsonParse(rawText)

  if (response.ok) {
    return parsedBody as T
  }

  const bodyObj = objectFromUnknown(parsedBody)
  const message =
    (typeof bodyObj.message === "string" ? bodyObj.message : "") ||
    (typeof bodyObj.name === "string" ? bodyObj.name : "") ||
    rawText ||
    `HTTP ${response.status}`

  throw new Error(`PayPal API request failed (${response.status}): ${message}`)
}
