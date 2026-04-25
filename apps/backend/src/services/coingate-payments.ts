import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { transactions } from "../schema.js"

type CoinGateAuthScheme = "token" | "bearer"

type CoinGateOrderResponse = {
  id?: number | string
  order_id?: string | null
  status?: string | null
  payment_url?: string | null
  token?: string | null
  price_amount?: number | string | null
  price_currency?: string | null
  created_at?: string | null
  updated_at?: string | null
  paid_at?: string | null
}

type CoinGateShopperInput = {
  ipAddress?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  companyName?: string | null
  taxId?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
}

type CoinGateShopperPayload = {
  type: "business" | "personal"
  ip_address?: string
  email?: string
  first_name?: string
  last_name?: string
  residence_address?: string
  residence_postal_code?: string
  residence_city?: string
  residence_country?: string
  company_details?: {
    name: string
    code?: string
    address?: string
    postal_code?: string
    city?: string
    country?: string
  }
}

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

function getEnv(key: string, required = true) {
  const value = process.env[key]

  if (!value || !value.trim()) {
    if (required) {
      throw new Error(`Missing required env: ${key}`)
    }

    return ""
  }

  return value.trim()
}

function getCoinGateEnvironment() {
  const raw = process.env.COINGATE_ENVIRONMENT?.trim().toLowerCase()

  if (raw === "sandbox" || raw === "test") {
    return "sandbox"
  }

  if (raw === "live" || raw === "production") {
    return "live"
  }

  return process.env.NODE_ENV === "production" ? "live" : "sandbox"
}

function getCoinGateApiBaseUrl() {
  if (getCoinGateEnvironment() === "sandbox") {
    return "https://api-sandbox.coingate.com/api/v2"
  }

  return "https://api.coingate.com/api/v2"
}

function getBackendBaseUrl() {
  const configured = process.env.BACKEND_BASE_URL?.trim()
  return configured && configured.length > 0
    ? configured
    : "http://localhost:3003"
}

function getWebBaseUrl() {
  const configured = process.env.WEB_BASE_URL?.trim()
  return configured && configured.length > 0
    ? configured
    : "http://localhost:3000"
}

function getReceiveCurrency() {
  const configured = process.env.COINGATE_RECEIVE_CURRENCY?.trim().toUpperCase()
  return configured && configured.length > 0 ? configured : "DO_NOT_CONVERT"
}

function normalizeCountryLookupKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
}

function normalizeCountryToIso2(value: string | null | undefined) {
  const raw = value?.trim()

  if (!raw) {
    return ""
  }

  if (/^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase()
  }

  return countryNameToIso2[normalizeCountryLookupKey(raw)] ?? ""
}

function trimmedOptional(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function toAmountMajor(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2))
}

function toAmountMinor(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100)
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100)
    }
  }

  return null
}

function buildAuthHeader(apiKey: string, scheme: CoinGateAuthScheme) {
  if (scheme === "bearer") {
    return `Bearer ${apiKey}`
  }

  return `Token ${apiKey}`
}

function safeJsonParse(text: string) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function stringifyUnknown(value: unknown) {
  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }

  return ""
}

function isCoinGateValidationError(err: unknown) {
  return err instanceof Error && err.message.includes("(422)")
}

function buildCoinGateShopperPayload(input?: CoinGateShopperInput | null) {
  if (!input) {
    return null
  }

  const country = normalizeCountryToIso2(input.country) || undefined
  const address = [input.addressLine1, input.addressLine2]
    .map((part) => trimmedOptional(part))
    .filter(Boolean)
    .join(", ")
  const companyName = trimmedOptional(input.companyName)
  const type = companyName ? "business" : "personal"
  const shopper: CoinGateShopperPayload = {
    type,
    ip_address: trimmedOptional(input.ipAddress),
    email: trimmedOptional(input.email),
    first_name: trimmedOptional(input.firstName),
    last_name: trimmedOptional(input.lastName),
  }

  if (companyName) {
    shopper.company_details = {
      name: companyName,
      code: trimmedOptional(input.taxId),
      address: address || undefined,
      postal_code: trimmedOptional(input.postalCode),
      city: trimmedOptional(input.city),
      country,
    }
  } else {
    shopper.residence_address = address || undefined
    shopper.residence_postal_code = trimmedOptional(input.postalCode)
    shopper.residence_city = trimmedOptional(input.city)
    shopper.residence_country = country
  }

  const hasShopperDetails = Object.entries(shopper).some(
    ([key, value]) => key !== "type" && value
  )

  if (!hasShopperDetails) {
    return null
  }

  return shopper
}

async function coinGateRequest<T>(input: {
  path: string
  method?: "GET" | "POST"
  body?: Record<string, unknown> | null
}) {
  const apiKey = getEnv("COINGATE_API_TOKEN")
  const url = `${getCoinGateApiBaseUrl()}${input.path}`
  const authSchemes: CoinGateAuthScheme[] = ["token", "bearer"]
  let latestAuthError: string | null = null

  for (const scheme of authSchemes) {
    const response = await fetch(url, {
      method: input.method ?? (input.body ? "POST" : "GET"),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(apiKey, scheme),
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
    })

    const rawText = await response.text()
    const parsedBody = safeJsonParse(rawText)

    if (response.ok) {
      return parsedBody as T
    }

    const errorMessage =
      (parsedBody &&
      typeof parsedBody === "object" &&
      "message" in parsedBody &&
      typeof parsedBody.message === "string"
        ? parsedBody.message
        : "") ||
      rawText ||
      `HTTP ${response.status}`

    if (response.status === 401 || response.status === 403) {
      latestAuthError = errorMessage
      continue
    }

    throw new Error(
      `CoinGate API request failed (${response.status}): ${errorMessage}`
    )
  }

  throw new Error(
    `CoinGate API authorization failed: ${latestAuthError ?? "Unauthorized"}`
  )
}

function buildCoinGateSuccessUrl(input: {
  orderId: number
  transactionId: number
}) {
  const base = new URL("/checkout/success", getWebBaseUrl())
  base.searchParams.set("orderId", String(input.orderId))
  base.searchParams.set("transactionId", String(input.transactionId))
  return base.toString()
}

function buildCoinGateCancelUrl(orderId: number) {
  return new URL(`/checkout/${orderId}/review`, getWebBaseUrl()).toString()
}

function buildCoinGateCallbackUrl() {
  return new URL("/webhooks/payments/coingate", getBackendBaseUrl()).toString()
}

function buildCoinGateTitle(input: { planName: string; durationDays: number }) {
  const value = `${input.planName} (${input.durationDays} days)`
  if (value.length <= 150) {
    return value
  }

  return `${value.slice(0, 147)}...`
}

function buildCoinGateDescription(input: {
  orderId: number
  invoiceId: number
  transactionReference: string
}) {
  const value = `TrueRDP order #${input.orderId}, invoice #${input.invoiceId}, transaction ${input.transactionReference}`
  if (value.length <= 500) {
    return value
  }

  return `${value.slice(0, 497)}...`
}

function extractStringValue(
  source: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string")
      if (typeof first === "string" && first.trim().length > 0) {
        return first.trim()
      }
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return null
}

function objectFromUnknown(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}

function parseRawBodyToObject(rawBody: string): Record<string, unknown> {
  const trimmed = rawBody.trim()

  if (!trimmed) {
    return {}
  }

  const asJson = safeJsonParse(trimmed)
  if (asJson && typeof asJson === "object" && !Array.isArray(asJson)) {
    return asJson as Record<string, unknown>
  }

  const params = new URLSearchParams(trimmed)
  const parsed: Record<string, unknown> = {}

  params.forEach((value, key) => {
    if (key in parsed) {
      const existing = parsed[key]
      if (Array.isArray(existing)) {
        existing.push(value)
        parsed[key] = existing
      } else {
        parsed[key] = [existing, value]
      }
      return
    }

    parsed[key] = value
  })

  return parsed
}

function extractCallbackPayload(input: {
  payload: unknown
  rawBody?: string | Buffer | undefined
}) {
  const parsedPayload = objectFromUnknown(input.payload)
  if (Object.keys(parsedPayload).length > 0) {
    return parsedPayload
  }

  const raw = input.rawBody
  if (typeof raw === "string") {
    return parseRawBodyToObject(raw)
  }

  if (Buffer.isBuffer(raw)) {
    return parseRawBodyToObject(raw.toString("utf8"))
  }

  return {}
}

async function getCoinGateOrderById(orderId: number) {
  const response = await coinGateRequest<
    {
      order?: CoinGateOrderResponse
      data?: CoinGateOrderResponse | { order?: CoinGateOrderResponse }
    } & CoinGateOrderResponse
  >({
    path: `/orders/${orderId}`,
    method: "GET",
  })

  const topLevel = objectFromUnknown(response)
  const nestedData = objectFromUnknown(topLevel.data)
  const nestedOrder = objectFromUnknown(topLevel.order ?? nestedData.order)
  const candidate =
    Object.keys(nestedOrder).length > 0
      ? nestedOrder
      : Object.keys(nestedData).length > 0
        ? nestedData
        : topLevel

  if (Object.keys(candidate).length === 0) {
    throw new Error(`CoinGate order ${orderId} returned an empty response`)
  }

  return candidate as CoinGateOrderResponse
}

function mapCoinGateStatusToEventType(status: string) {
  const normalized = status.trim().toLowerCase()

  if (normalized === "paid") {
    return "payment.succeeded"
  }

  if (
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "expired" ||
    normalized === "invalid"
  ) {
    return "payment.failed"
  }

  return "payment.processing"
}

function isCoinGateTerminalStatus(status: string) {
  const normalized = status.trim().toLowerCase()

  return (
    normalized === "paid" ||
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "expired" ||
    normalized === "invalid"
  )
}

function getPendingStatusPollAttempts() {
  const raw = process.env.COINGATE_PENDING_STATUS_POLL_ATTEMPTS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : NaN

  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  // Additional attempts after the initial read.
  return 4
}

function getPendingStatusPollDelayMs() {
  const raw = process.env.COINGATE_PENDING_STATUS_POLL_DELAY_MS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : NaN

  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 500
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function pollCoinGateOrderUntilTerminal(orderId: number) {
  let latest = await getCoinGateOrderById(orderId)
  const attempts = getPendingStatusPollAttempts()
  const delayMs = getPendingStatusPollDelayMs()

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const status = stringifyUnknown(latest.status).trim().toLowerCase()

    if (isCoinGateTerminalStatus(status)) {
      return latest
    }

    if (delayMs > 0) {
      await sleep(delayMs)
    }

    latest = await getCoinGateOrderById(orderId)
  }

  return latest
}

export async function createCoinGateOrderForTransaction(input: {
  amountMinor: number
  currency: string
  orderId: number
  invoiceId: number
  transactionId: number
  reference: string
  planName: string
  durationDays: number
  billingEmail?: string | null
  shopper?: CoinGateShopperInput | null
}) {
  const callbackToken = randomUUID().replaceAll("-", "")
  const currency = input.currency.trim().toUpperCase()
  const shopper = buildCoinGateShopperPayload(input.shopper)
  const body: Record<string, unknown> = {
    order_id: input.reference,
    price_amount: toAmountMajor(input.amountMinor),
    price_currency: currency,
    receive_currency: getReceiveCurrency(),
    title: buildCoinGateTitle({
      planName: input.planName,
      durationDays: input.durationDays,
    }),
    description: buildCoinGateDescription({
      orderId: input.orderId,
      invoiceId: input.invoiceId,
      transactionReference: input.reference,
    }),
    callback_url: buildCoinGateCallbackUrl(),
    cancel_url: buildCoinGateCancelUrl(input.orderId),
    success_url: buildCoinGateSuccessUrl({
      orderId: input.orderId,
      transactionId: input.transactionId,
    }),
    token: callbackToken,
    purchaser_email: input.billingEmail?.trim() || undefined,
  }

  let response: CoinGateOrderResponse

  try {
    response = await coinGateRequest<CoinGateOrderResponse>({
      path: "/orders",
      method: "POST",
      body: shopper ? { ...body, shopper } : body,
    })
  } catch (err) {
    if (!shopper || !isCoinGateValidationError(err)) {
      throw err
    }

    response = await coinGateRequest<CoinGateOrderResponse>({
      path: "/orders",
      method: "POST",
      body,
    })
  }

  const paymentUrl =
    typeof response.payment_url === "string" ? response.payment_url.trim() : ""

  if (!paymentUrl) {
    throw new Error("CoinGate order did not return payment_url")
  }

  const rawId =
    typeof response.id === "number"
      ? response.id
      : typeof response.id === "string"
        ? Number.parseInt(response.id, 10)
        : NaN

  if (!Number.isFinite(rawId)) {
    throw new Error("CoinGate order did not return a valid numeric id")
  }

  return {
    orderId: Math.trunc(rawId),
    paymentUrl,
    status: (response.status ?? "").toString(),
    callbackToken,
    environment: getCoinGateEnvironment(),
  }
}

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

  const status =
    stringifyUnknown(order.status).trim().toLowerCase() || "unknown"
  const eventType = mapCoinGateStatusToEventType(status)
  const occurredAt =
    stringifyUnknown(order.paid_at).trim() ||
    stringifyUnknown(order.updated_at).trim() ||
    stringifyUnknown(order.created_at).trim() ||
    null
  const eventId = `coingate:${parsedOrderId}:${status}`

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

export async function normalizeCoinGateOrderStatus(orderId: number) {
  const order = await pollCoinGateOrderUntilTerminal(orderId)
  const status =
    stringifyUnknown(order.status).trim().toLowerCase() || "unknown"
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
