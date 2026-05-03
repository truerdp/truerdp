import { randomUUID } from "node:crypto"
import { coinGateRequest } from "./client.js"
import type { CoinGateOrderResponse, CoinGateShopperInput } from "./shared.js"
import {
  buildCoinGateShopperPayload,
  getBackendBaseUrl,
  getCoinGateEnvironment,
  getReceiveCurrency,
  getWebBaseUrl,
  isCoinGateValidationError,
  toAmountMajor,
} from "./shared.js"

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
