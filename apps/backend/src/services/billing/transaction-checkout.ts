import { eq } from "drizzle-orm"
import type { CoinGateShopperInput } from "../coingate-payments/shared.js"
import { createCoinGateOrderForTransaction } from "../coingate-payments.js"
import { createCheckoutSessionForTransaction } from "../dodo-payments.js"
import type { DodoDiscountInput } from "../dodo-payments/shared.js"
import { db } from "../../db.js"
import { transactions, type OrderBillingDetails } from "../../schema.js"
import { markTransactionSetupFailed } from "./transaction-attempts.js"

type BillingDetails = OrderBillingDetails | null

export async function runDodoHostedCheckout(input: {
  transactionId: number
  planPricingId: number
  orderId: number
  invoiceId: number
  amountMinor: number
  currency: string
  reference: string
  billing: BillingDetails
  discount: DodoDiscountInput | null
}) {
  const billing = input.billing
  const name =
    (billing?.firstName?.trim() || "") +
    (billing?.lastName ? ` ${billing.lastName.trim()}` : "")
  const customer =
    billing && (billing.email || name.trim())
      ? {
          email: billing.email,
          name: name.trim() || undefined,
          phone_number: billing.phone ?? undefined,
        }
      : undefined

  try {
    const session = await createCheckoutSessionForTransaction({
      planPricingId: input.planPricingId,
      amountMinor: input.amountMinor,
      currency: input.currency,
      orderId: input.orderId,
      invoiceId: input.invoiceId,
      transactionId: input.transactionId,
      reference: input.reference,
      discount: input.discount,
      customer,
      billing: billing
        ? {
            street: billing.addressLine1,
            city: billing.city,
            state: billing.state,
            zipcode: billing.postalCode,
            country: billing.country,
          }
        : undefined,
    })

    await db
      .update(transactions)
      .set({
        metadata: {
          dodo_session_id: session.sessionId,
          dodo_checkout_url: session.checkoutUrl,
          dodo_environment: session.environment,
        } as unknown as typeof transactions.$inferInsert.metadata,
      })
      .where(eq(transactions.id, input.transactionId))

    return session.checkoutUrl
  } catch (error) {
    await markTransactionSetupFailed(input.transactionId, error)
    throw error
  }
}

function buildCoinGateShopper(
  billing: BillingDetails,
  ipAddress?: string | null
): CoinGateShopperInput | null {
  if (!billing) {
    return null
  }

  return {
    ipAddress,
    firstName: billing.firstName,
    lastName: billing.lastName,
    email: billing.email,
    companyName: billing.companyName,
    taxId: billing.taxId,
    addressLine1: billing.addressLine1,
    addressLine2: billing.addressLine2,
    city: billing.city,
    state: billing.state,
    postalCode: billing.postalCode,
    country: billing.country,
  }
}

export async function runCoinGateHostedCheckout(input: {
  transactionId: number
  orderId: number
  invoiceId: number
  amountMinor: number
  currency: string
  reference: string
  planName: string
  durationDays: number
  billing: BillingDetails
  ipAddress?: string | null
}) {
  try {
    const session = await createCoinGateOrderForTransaction({
      amountMinor: input.amountMinor,
      currency: input.currency,
      orderId: input.orderId,
      invoiceId: input.invoiceId,
      transactionId: input.transactionId,
      reference: input.reference,
      planName: input.planName,
      durationDays: input.durationDays,
      billingEmail: input.billing?.email ?? null,
      shopper: buildCoinGateShopper(input.billing, input.ipAddress),
    })

    await db
      .update(transactions)
      .set({
        metadata: {
          coingate_order_id: session.orderId,
          coingate_payment_url: session.paymentUrl,
          coingate_status: session.status,
          coingate_callback_token: session.callbackToken,
          coingate_environment: session.environment,
        } as unknown as typeof transactions.$inferInsert.metadata,
      })
      .where(eq(transactions.id, input.transactionId))

    return session.paymentUrl
  } catch (error) {
    await markTransactionSetupFailed(input.transactionId, error)
    throw error
  }
}
