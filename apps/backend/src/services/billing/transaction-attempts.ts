import { and, desc, eq, gte, inArray, lt } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, plans, transactions } from "../../schema.js"
import { sendPaymentFailedNotification } from "./notifications.js"

export async function expireStaleBillingAttempts(input: {
  userId: number
  orderId: number
  now: Date
}) {
  const staleInvoices = await db
    .select({
      invoiceId: invoices.id,
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .where(
      and(
        eq(orders.userId, input.userId),
        eq(orders.id, input.orderId),
        eq(invoices.status, "unpaid"),
        lt(invoices.expiresAt, input.now)
      )
    )

  if (staleInvoices.length === 0) {
    return
  }

  const staleInvoiceIds = staleInvoices.map((invoice) => invoice.invoiceId)

  await db.transaction(async (tx) => {
    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(inArray(invoices.id, staleInvoiceIds))

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: "Invoice expired",
      })
      .where(
        and(
          inArray(transactions.invoiceId, staleInvoiceIds),
          eq(transactions.status, "pending")
        )
      )
  })

  for (const invoiceId of staleInvoiceIds) {
    try {
      await sendPaymentFailedNotification({
        invoiceId,
        reason: "Invoice expired before payment confirmation",
      })
    } catch (notificationError) {
      console.error(
        "Failed to send payment expiration notification",
        notificationError
      )
    }
  }
}

export async function findReusableBillingTransaction(input: {
  userId: number
  orderId: number
  now: Date
}) {
  const reusableAttempts = await db
    .select({
      transaction: {
        id: transactions.id,
        userId: transactions.userId,
        invoiceId: transactions.invoiceId,
        instanceId: transactions.instanceId,
        amount: transactions.amount,
        method: transactions.method,
        gateway: transactions.gateway,
        status: transactions.status,
        reference: transactions.reference,
        idempotencyKey: transactions.idempotencyKey,
        failureReason: transactions.failureReason,
        metadata: transactions.metadata,
        confirmedAt: transactions.confirmedAt,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
      },
      invoice: {
        id: invoices.id,
        orderId: invoices.orderId,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        discount: invoices.discount,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        couponId: invoices.couponId,
        status: invoices.status,
        expiresAt: invoices.expiresAt,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
      },
      order: {
        id: orders.id,
        userId: orders.userId,
        planId: orders.planId,
        planPricingId: orders.planPricingId,
        renewalInstanceId: orders.renewalInstanceId,
        kind: orders.kind,
        planName: orders.planName,
        planPriceUsdCents: orders.planPriceUsdCents,
        durationDays: orders.durationDays,
        billingDetails: orders.billingDetails,
        status: orders.status,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      },
      plan: {
        id: plans.id,
        name: orders.planName,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
    })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(plans, eq(orders.planId, plans.id))
    .where(
      and(
        eq(transactions.userId, input.userId),
        eq(transactions.status, "pending"),
        eq(invoices.status, "unpaid"),
        eq(orders.status, "pending_payment"),
        eq(orders.id, input.orderId),
        gte(invoices.expiresAt, input.now)
      )
    )
    .orderBy(desc(transactions.createdAt))
    .limit(1)

  return reusableAttempts[0] ?? null
}

export async function findReusableInvoice(input: { orderId: number; now: Date }) {
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.orderId, input.orderId),
        eq(invoices.status, "unpaid"),
        gte(invoices.expiresAt, input.now)
      )
    )
    .orderBy(desc(invoices.createdAt))
    .limit(1)

  return invoiceResult[0] ?? null
}

export async function markTransactionSetupFailed(
  transactionId: number,
  error: unknown
) {
  const message =
    error instanceof Error
      ? error.message
      : "Unable to create hosted checkout session"

  await db
    .update(transactions)
    .set({
      status: "failed",
      failureReason: message,
    })
    .where(eq(transactions.id, transactionId))
}
