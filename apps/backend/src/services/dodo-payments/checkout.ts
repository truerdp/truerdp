import {
  CheckoutSessionCreatePayload,
  CheckoutSessionResponse,
  DodoDiscountInput,
  getDefaultCurrency,
  getDodoClient,
  getEnvironment,
  normalizeCountryToIso2,
} from "./shared.js"
import { ensureDodoDiscount } from "./discounts.js"
import { resolveDodoProductIdForPlanPricing } from "./products.js"

function buildReturnUrl(input: { orderId: number; transactionId: number }) {
  const base = process.env.WEB_BASE_URL?.trim() || "http://localhost:3000"
  const u = new URL("/checkout/success", base)
  u.searchParams.set("orderId", String(input.orderId))
  u.searchParams.set("transactionId", String(input.transactionId))
  return u.toString()
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
  const productId = await resolveDodoProductIdForPlanPricing(input.planPricingId)

  const returnUrl = buildReturnUrl({
    orderId: input.orderId,
    transactionId: input.transactionId,
  })

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

