import DodoPayments from "dodopayments"

export interface CheckoutSessionCreatePayload {
  product_cart: { product_id: string; quantity: number }[]
  return_url: string
  billing_currency?: string
  discount_code?: string
  customer?: { email?: string; name?: string; phone_number?: string }
  billing_address?: {
    street?: string
    city?: string
    state?: string
    country: string
    zipcode?: string
  }
  feature_flags?: {
    allow_discount_code?: boolean
  }
  metadata?: Record<string, string>
}

export interface CheckoutSessionResponse {
  checkout_url?: string
  url?: string
  session_id?: string
}

export interface DodoDiscountInput {
  code: string
  type: "percent" | "flat"
  value: number
  maxUses?: number | null
  expiresAt?: Date | null
  isActive?: boolean
  existingDodoDiscountId?: string | null
}

export interface DodoDiscountRecord {
  discount_id?: string
  code?: string
  amount?: number
  type?: string
  expires_at?: string | null
  usage_limit?: number | null
}

export type PlainHeaders = Record<string, string | string[] | undefined>

const countryNameToIso2: Record<string, string> = {
  india: "IN",
  bharat: "IN",
  ind: "IN",
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  uae: "AE",
  "united arab emirates": "AE",
  russia: "RU",
  vietnam: "VN",
  "south korea": "KR",
  "north korea": "KP",
  "czech republic": "CZ",
}

function normalizeCountryLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
}

export function normalizeCountryToIso2(value: string) {
  const raw = value.trim()

  if (/^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase()
  }

  const code = countryNameToIso2[normalizeCountryLookupKey(raw)]

  if (code) {
    return code
  }

  return ""
}

function getEnv(key: string, required = true) {
  const v = process.env[key]
  if (!v || !v.trim()) {
    if (required) {
      throw new Error(`Missing required env: ${key}`)
    }
    return ""
  }
  return v.trim()
}

export function getEnvironment() {
  const raw = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim()
  if (raw === "test_mode" || raw === "live_mode") return raw
  return process.env.NODE_ENV !== "production" ? "test_mode" : "live_mode"
}

export function getDefaultCurrency() {
  const value = process.env.DODO_DEFAULT_CURRENCY?.trim().toUpperCase()
  return value && value.length === 3 ? value : "USD"
}

export function getTaxCategory() {
  const value = process.env.DODO_TAX_CATEGORY?.trim()
  if (value === "digital_products") return value
  if (value === "saas") return value
  if (value === "e_book") return value
  if (value === "edtech") return value
  return "saas"
}

let singletonClient: DodoPayments | null = null

export function getDodoClient() {
  if (singletonClient) return singletonClient
  singletonClient = new DodoPayments({
    bearerToken: getEnv("DODO_PAYMENTS_API_KEY"),
    environment: getEnvironment(),
    webhookKey: getEnv("DODO_PAYMENTS_WEBHOOK_KEY"),
  })
  return singletonClient
}

export function verifyAndUnwrapDodoWebhook(
  rawBody: string,
  headers: PlainHeaders
): Record<string, unknown> {
  const client = getDodoClient()
  const unwrapped = client.webhooks.unwrap(rawBody, {
    headers: headers as Record<string, string | string[] | undefined>,
  }) as unknown as Record<string, unknown>

  const pickHeader = (name: string): string => {
    const v = (headers[name] ??
      headers[name.toLowerCase() as keyof typeof headers] ??
      headers[name.toUpperCase() as keyof typeof headers]) as
      | string
      | string[]
      | undefined
    if (Array.isArray(v)) return v[0] ?? ""
    return v ?? ""
  }

  const webhookId = String(pickHeader("webhook-id") || "").trim()
  if (webhookId) {
    ;(unwrapped as Record<string, unknown>).id = webhookId
    ;(unwrapped as Record<string, unknown>).event_id = webhookId
  }

  return unwrapped
}

