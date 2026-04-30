import DodoPayments from "dodopayments"
import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { planPricing } from "../schema.js"

interface CheckoutSessionCreatePayload {
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

interface CheckoutSessionResponse {
  checkout_url?: string
  url?: string
  session_id?: string
}

interface DodoDiscountInput {
  code: string
  type: "percent" | "flat"
  value: number
  maxUses?: number | null
  expiresAt?: Date | null
  isActive?: boolean
  existingDodoDiscountId?: string | null
}

interface DodoDiscountRecord {
  discount_id?: string
  code?: string
  amount?: number
  type?: string
  expires_at?: string | null
  usage_limit?: number | null
}

type PlainHeaders = Record<string, string | string[] | undefined>

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

function normalizeCountryToIso2(value: string) {
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

function getEnvironment() {
  const raw = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim()
  if (raw === "test_mode" || raw === "live_mode") return raw
  // default to test_mode in dev if unset, otherwise live_mode
  return process.env.NODE_ENV !== "production" ? "test_mode" : "live_mode"
}

function getDefaultCurrency() {
  const value = process.env.DODO_DEFAULT_CURRENCY?.trim().toUpperCase()
  return value && value.length === 3 ? value : "USD"
}

function getTaxCategory() {
  const value = process.env.DODO_TAX_CATEGORY?.trim()
  if (value === "digital_products") return value
  if (value === "saas") return value
  if (value === "e_book") return value
  if (value === "edtech") return value
  return "saas"
}

function buildDodoProductName(input: {
  planName: string
  durationDays: number
}) {
  const name = `${input.planName} (${input.durationDays} days)`
  if (name.length <= 100) return name
  return `${name.slice(0, 97)}...`
}

function buildDodoProductPayload(input: {
  planPricingId: number
  planName: string
  durationDays: number
  priceUsdCents: number
}) {
  return {
    name: buildDodoProductName({
      planName: input.planName,
      durationDays: input.durationDays,
    }),
    description: `Auto-synced from admin plan pricing #${input.planPricingId}`,
    tax_category: getTaxCategory(),
    metadata: {
      source: "admin_plan_sync",
      plan_pricing_id: String(input.planPricingId),
      duration_days: String(input.durationDays),
    },
    price: {
      type: "one_time_price",
      currency: getDefaultCurrency(),
      discount: 0,
      price: input.priceUsdCents,
      purchasing_power_parity: false,
    },
  }
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

export async function syncDodoProductForPlanPricing(input: {
  planPricingId: number
  planName: string
  durationDays: number
  priceUsdCents: number
  existingDodoProductId?: string | null
}) {
  const client = getDodoClient()
  const payload = buildDodoProductPayload(input)

  if (input.existingDodoProductId) {
    await client.products.update(input.existingDodoProductId, payload)
    return {
      dodoProductId: input.existingDodoProductId,
      syncedAt: new Date(),
    }
  }

  const created = await client.products.create(payload)
  const dodoProductId = created.product_id

  if (!dodoProductId) {
    throw new Error(
      `Dodo product create response missing product_id for planPricingId=${input.planPricingId}`
    )
  }

  return {
    dodoProductId,
    syncedAt: new Date(),
  }
}

async function resolveDodoProductIdForPlanPricing(planPricingId: number) {
  const [pricing] = await db
    .select({
      dodoProductId: planPricing.dodoProductId,
      dodoSyncStatus: planPricing.dodoSyncStatus,
    })
    .from(planPricing)
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  if (!pricing) {
    throw new Error(`Plan pricing ${planPricingId} not found`)
  }

  if (!pricing.dodoProductId) {
    throw new Error(
      `No Dodo product is synced for planPricingId=${planPricingId}. Update the plan in admin to trigger sync.`
    )
  }

  if (pricing.dodoSyncStatus !== "synced") {
    throw new Error(
      `Dodo product sync status is ${pricing.dodoSyncStatus} for planPricingId=${planPricingId}`
    )
  }

  return pricing.dodoProductId
}

function buildReturnUrl(input: { orderId: number; transactionId: number }) {
  const base = getEnv("WEB_BASE_URL", false) || "http://localhost:3000"
  const u = new URL("/checkout/success", base)
  u.searchParams.set("orderId", String(input.orderId))
  u.searchParams.set("transactionId", String(input.transactionId))
  return u.toString()
}

function toDodoDiscountPayload(input: DodoDiscountInput) {
  const code = input.code.trim().toUpperCase()

  if (!code) {
    throw new Error("Dodo discount code is required")
  }

  return {
    code,
    name: `TrueRDP ${code}`,
    type: input.type === "percent" ? "percentage" : "flat",
    amount: input.type === "percent" ? input.value * 100 : input.value,
    expires_at:
      input.isActive === false
        ? new Date(0).toISOString()
        : (input.expiresAt?.toISOString() ?? null),
    usage_limit: input.maxUses ?? null,
  }
}

async function findDodoDiscountByCode(code: string) {
  const client = getDodoClient()
  const normalizedCode = code.trim().toUpperCase()
  const result = client.discounts.list({
    code: normalizedCode,
    page_size: 100,
  })

  if (
    result &&
    typeof result === "object" &&
    Symbol.asyncIterator in result
  ) {
    for await (const discount of result as AsyncIterable<DodoDiscountRecord>) {
      if (discount.code?.trim().toUpperCase() === normalizedCode) {
        return discount
      }
    }

    return null
  }

  const items = (await result) as { items?: DodoDiscountRecord[] }

  return (
    items.items?.find(
      (discount) => discount.code?.trim().toUpperCase() === normalizedCode
    ) ?? null
  )
}

async function ensureDodoDiscount(input: DodoDiscountInput) {
  const client = getDodoClient()
  const payload = toDodoDiscountPayload(input)
  const existing = input.existingDodoDiscountId
    ? ({ discount_id: input.existingDodoDiscountId } satisfies DodoDiscountRecord)
    : await findDodoDiscountByCode(payload.code)

  if (!existing?.discount_id) {
    const created = (await client.discounts.create(
      payload
    )) as DodoDiscountRecord

    if (!created.discount_id) {
      throw new Error(`Dodo discount create response missing discount_id`)
    }

    return created.discount_id
  }

  await client.discounts.update(existing.discount_id, payload)
  return existing.discount_id
}

export async function syncDodoDiscountForCoupon(input: DodoDiscountInput) {
  const dodoDiscountId = await ensureDodoDiscount(input)

  return {
    dodoDiscountId,
    syncedAt: new Date(),
  }
}

export async function createCheckoutSessionForTransaction(input: {
  planPricingId: number
  amountMinor: number
  currency: string
  orderId: number
  invoiceId: number
  transactionId: number
  reference: string
  discount?: DodoDiscountInput | null
  customer?: { email?: string; name?: string; phone_number?: string }
  billing?: {
    street?: string
    city?: string
    state?: string
    zipcode?: string | number
    country: string
  }
}) {
  const client = getDodoClient()
  const productId = await resolveDodoProductIdForPlanPricing(
    input.planPricingId
  )

  const returnUrl = buildReturnUrl({
    orderId: input.orderId,
    transactionId: input.transactionId,
  })

  // metadata is used to reconcile webhooks → our transaction reference
  const metadata: Record<string, string> = {
    reference: input.reference,
    transaction_id: String(input.transactionId),
    order_id: String(input.orderId),
    invoice_id: String(input.invoiceId),
  }

  const payload: CheckoutSessionCreatePayload = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: returnUrl,
    billing_currency: getDefaultCurrency(),
    metadata,
  }

  if (input.discount) {
    await ensureDodoDiscount(input.discount)
    const discountCode = input.discount.code.trim().toUpperCase()
    payload.discount_code = discountCode
    metadata.discount_code = discountCode
    payload.feature_flags = {
      allow_discount_code: true,
    }
  }

  const billingCountry = input.billing
    ? normalizeCountryToIso2(input.billing.country)
    : ""

  if (input.customer && (input.customer.email || input.customer.name)) {
    payload.customer = {
      email: input.customer.email,
      name: input.customer.name,
      phone_number: input.customer.phone_number,
    }
  }

  if (input.billing) {
    payload.billing_address = {
      street: input.billing.street,
      city: input.billing.city,
      state: input.billing.state,
      country: billingCountry,
      zipcode:
        typeof input.billing.zipcode === "number"
          ? String(input.billing.zipcode)
          : input.billing.zipcode,
    }

    if (!billingCountry) {
      delete payload.billing_address
    }
  }

  // Amounts in Dodo are derived from the product catalog plus discount_code.
  // We still include our invoice amount/currency context in metadata for traceability.
  metadata.amount_minor = String(input.amountMinor)
  metadata.currency = input.currency

  const session = (await client.checkoutSessions.create(
    payload
  )) as unknown as CheckoutSessionResponse

  const checkoutUrl = session.checkout_url ?? session.url ?? null

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    throw new Error("Dodo checkout session did not return a checkout URL")
  }

  return {
    sessionId: session.session_id ?? null,
    checkoutUrl,
    environment: getEnvironment(),
  }
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
