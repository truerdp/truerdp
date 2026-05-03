import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, transactions } from "../../schema.js"
import { calculatePrice } from "../pricing.js"
import { getCouponById, getBillingOrderById } from "./order-query.js"
import { getPlanPricingById } from "./pricing.js"
import {
  expireStaleBillingAttempts,
  findReusableBillingTransaction,
  findReusableInvoice,
} from "./transaction-attempts.js"
import {
  runCoinGateHostedCheckout,
  runDodoHostedCheckout,
} from "./transaction-checkout.js"
import {
  extractGatewayRedirectUrlFromMetadata,
  formatBillingTransactionResponse,
} from "./transaction-format.js"
import { sendInvoiceCreatedNotification } from "./notifications.js"
import {
  BillingError,
  SupportedPaymentMethod,
  createInvoiceExpiry,
  createInvoiceNumber,
  createTransactionReference,
  getOrderPlanPriceUsdCents,
  requireInsertedRecord,
} from "./shared.js"

export async function createBillingTransaction(input: {
  userId: number
  orderId: number
  method: SupportedPaymentMethod
  ipAddress?: string | null
}) {
  const orderResult = await getBillingOrderById(input.orderId)

  if (!orderResult) {
    throw new BillingError(404, "Order not found")
  }

  if (orderResult.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (orderResult.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is not pending payment")
  }

  if (!orderResult.order.billingDetails) {
    throw new BillingError(400, "Billing details are required before payment")
  }

  const pricingSelection = await getPlanPricingById(orderResult.order.planPricingId)

  if (!pricingSelection || !pricingSelection.isActive) {
    throw new BillingError(400, "Order pricing is no longer active")
  }

  if (!pricingSelection.plan.isActive) {
    throw new BillingError(400, "Selected plan is inactive")
  }

  const orderPlanPriceUsdCents = getOrderPlanPriceUsdCents(orderResult.order)

  if (!Number.isFinite(orderPlanPriceUsdCents)) {
    throw new BillingError(500, "Order is missing a valid plan price snapshot")
  }
  const orderPlanPriceUsdCentsValue = Number(orderPlanPriceUsdCents)

  const totalAmount = await calculatePrice(input.userId, orderResult.order.planPricingId)
  const discount = Math.max(0, orderPlanPriceUsdCentsValue - totalAmount)
  const now = new Date()

  await expireStaleBillingAttempts({
    userId: input.userId,
    orderId: orderResult.order.id,
    now,
  })

  const reusableTransaction = await findReusableBillingTransaction({
    userId: input.userId,
    orderId: orderResult.order.id,
    now,
  })

  if (reusableTransaction) {
    const response = formatBillingTransactionResponse(reusableTransaction)
    const gatewayRedirectUrl = extractGatewayRedirectUrlFromMetadata({
      method: input.method,
      metadata: reusableTransaction.transaction.metadata,
    })

    return {
      ...response,
      gatewayRedirectUrl,
    }
  }

  const reusableInvoice = await findReusableInvoice({
    orderId: orderResult.order.id,
    now,
  })

  const created = await db.transaction(async (tx) => {
    let invoice = reusableInvoice
    let createdInvoiceId: number | null = null

    if (!invoice) {
      const insertedInvoices = await tx
        .insert(invoices)
        .values({
          orderId: orderResult.order.id,
          invoiceNumber: createInvoiceNumber(),
          subtotal: orderPlanPriceUsdCentsValue,
          discount,
          totalAmount,
          status: "unpaid",
          expiresAt: createInvoiceExpiry(now),
        })
        .returning()

      invoice = requireInsertedRecord(insertedInvoices[0], "invoice")
      createdInvoiceId = invoice.id
    }

    const insertedTransactions = await tx
      .insert(transactions)
      .values({
        userId: input.userId,
        invoiceId: invoice.id,
        instanceId: orderResult.order.renewalInstanceId,
        amount: invoice.totalAmount,
        method: input.method,
        status: "pending",
        reference: createTransactionReference(),
      })
      .returning()

    const transaction = requireInsertedRecord(insertedTransactions[0], "transaction")

    return {
      transaction,
      invoice,
      order: orderResult.order,
      createdInvoiceId,
    }
  })

  if (created.createdInvoiceId) {
    await sendInvoiceCreatedNotification(created.createdInvoiceId)
  }
  let gatewayRedirectUrl: string | null = null
  const requiresHostedCheckout =
    input.method === "dodo_checkout" || input.method === "coingate_checkout"
  let transactionReference = created.transaction.reference
  if (requiresHostedCheckout && !transactionReference) {
    transactionReference = createTransactionReference()

    await db
      .update(transactions)
      .set({ reference: transactionReference })
      .where(eq(transactions.id, created.transaction.id))

    ;(created.transaction as unknown as { reference: string | null }).reference =
      transactionReference
  }
  const invoiceCoupon = await getCouponById(created.invoice.couponId)

  if (input.method === "dodo_checkout") {
    const txnRef = transactionReference ?? createTransactionReference()
    gatewayRedirectUrl = await runDodoHostedCheckout({
      transactionId: created.transaction.id,
      planPricingId: orderResult.order.planPricingId,
      orderId: orderResult.order.id,
      invoiceId: created.invoice.id,
      amountMinor: created.invoice.totalAmount,
      currency: created.invoice.currency,
      reference: txnRef,
      billing: orderResult.order.billingDetails,
      discount: invoiceCoupon,
    })
  }

  if (input.method === "coingate_checkout") {
    const txnRef = transactionReference ?? createTransactionReference()
    gatewayRedirectUrl = await runCoinGateHostedCheckout({
      transactionId: created.transaction.id,
      orderId: orderResult.order.id,
      invoiceId: created.invoice.id,
      amountMinor: created.invoice.totalAmount,
      currency: created.invoice.currency,
      reference: txnRef,
      planName: created.order.planName,
      durationDays: created.order.durationDays,
      billing: orderResult.order.billingDetails,
      ipAddress: input.ipAddress,
    })
  }
  const response = formatBillingTransactionResponse({
    transaction: created.transaction,
    invoice: created.invoice,
    order: created.order,
    plan: {
      id: orderResult.plan.id,
      name: created.order.planName,
      cpu: orderResult.plan.cpu,
      ram: orderResult.plan.ram,
      storage: orderResult.plan.storage,
    },
  })

  return {
    ...response,
    gatewayRedirectUrl,
  }
}
