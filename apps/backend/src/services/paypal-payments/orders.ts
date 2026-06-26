import {
  getBackendBaseUrl,
  getPayPalEnvironment,
  getWebBaseUrl,
} from "./config.js"
import { paypalRequest } from "./client.js"
import { formatPayPalAmount } from "./parsing.js"
import type { PayPalOrderResponse } from "./types.js"

function buildPayPalReturnUrl(input: { transactionId: number }) {
  return new URL(
    `/transactions/${input.transactionId}/paypal-return`,
    getBackendBaseUrl()
  ).toString()
}

function buildPayPalCancelUrl(orderId: number) {
  return new URL(`/checkout/${orderId}/review`, getWebBaseUrl()).toString()
}

function findApprovalUrl(order: PayPalOrderResponse) {
  return (
    order.links?.find((link) => link.rel === "approve")?.href?.trim() ?? null
  )
}

export async function createPayPalOrderForTransaction(input: {
  amountMinor: number
  currency: string
  orderId: number
  invoiceNumber: string
  transactionId: number
  reference: string
  planName: string
  durationDays: number
}) {
  const order = await paypalRequest<PayPalOrderResponse>({
    path: "/v2/checkout/orders",
    method: "POST",
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: input.reference,
          invoice_id: input.invoiceNumber,
          description: `${input.planName} - ${input.durationDays} days`,
          amount: {
            currency_code: input.currency.toUpperCase(),
            value: formatPayPalAmount(input.amountMinor),
          },
        },
      ],
      application_context: {
        brand_name: "TrueRDP",
        landing_page: "LOGIN",
        user_action: "PAY_NOW",
        return_url: buildPayPalReturnUrl({
          transactionId: input.transactionId,
        }),
        cancel_url: buildPayPalCancelUrl(input.orderId),
      },
    },
  })

  const orderId = typeof order.id === "string" ? order.id.trim() : ""
  const approvalUrl = findApprovalUrl(order)

  if (!orderId) {
    throw new Error("PayPal order create response missing id")
  }

  if (!approvalUrl) {
    throw new Error("PayPal order create response missing approval URL")
  }

  return {
    orderId,
    approvalUrl,
    status: order.status ?? null,
    environment: getPayPalEnvironment(),
  }
}

export async function capturePayPalOrder(orderId: string) {
  return paypalRequest<PayPalOrderResponse>({
    path: `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    method: "POST",
    body: {},
  })
}
