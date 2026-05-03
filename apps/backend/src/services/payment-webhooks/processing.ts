import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import {
  invoices,
  orders,
  paymentWebhookEvents,
  transactions,
} from "../../schema.js"
import {
  BillingError,
  confirmPendingTransaction,
  notifyPaymentFailureForInvoice,
} from "../billing.js"
import type { NormalizedPaymentEvent } from "./normalization.js"

export async function updateWebhookEventStatus(input: {
  eventRowId: number
  status: "processed" | "ignored" | "failed"
  errorMessage?: string | null
}) {
  await db
    .update(paymentWebhookEvents)
    .set({
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      processedAt: new Date(),
    })
    .where(eq(paymentWebhookEvents.id, input.eventRowId))
}

async function markPendingTransactionAsFailed(input: {
  transactionId: number
  invoiceId: number
  reason: string
}) {
  await db.transaction(async (tx) => {
    const [invoiceRecord] = await tx
      .select({ orderId: invoices.orderId })
      .from(invoices)
      .where(eq(invoices.id, input.invoiceId))
      .limit(1)

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: input.reason,
      })
      .where(eq(transactions.id, input.transactionId))

    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(eq(invoices.id, input.invoiceId))

    if (invoiceRecord?.orderId) {
      await tx
        .update(orders)
        .set({ status: "cancelled" })
        .where(eq(orders.id, invoiceRecord.orderId))
    }
  })
}

export async function processWebhookEvent(input: {
  eventRowId: number
  normalized: NormalizedPaymentEvent
}): Promise<"processed" | "ignored"> {
  const { normalized } = input

  if (
    !normalized.externalReference &&
    normalized.transactionIdFromMetadata == null &&
    normalized.invoiceIdFromMetadata == null
  ) {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
    })

    return "ignored"
  }

  let transaction = (
    await db
      .select({
        id: transactions.id,
        status: transactions.status,
        invoiceId: transactions.invoiceId,
      })
      .from(transactions)
      .where(eq(transactions.reference, normalized.externalReference ?? ""))
      .limit(1)
  )[0]

  if (!transaction && normalized.transactionIdFromMetadata != null) {
    transaction = (
      await db
        .select({
          id: transactions.id,
          status: transactions.status,
          invoiceId: transactions.invoiceId,
        })
        .from(transactions)
        .where(eq(transactions.id, normalized.transactionIdFromMetadata))
        .limit(1)
    )[0]
  }

  if (!transaction && normalized.invoiceIdFromMetadata != null) {
    transaction = (
      await db
        .select({
          id: transactions.id,
          status: transactions.status,
          invoiceId: transactions.invoiceId,
        })
        .from(transactions)
        .where(eq(transactions.invoiceId, normalized.invoiceIdFromMetadata))
        .limit(1)
    )[0]
  }

  if (!transaction) {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
      errorMessage: "No matching transaction for webhook reference",
    })

    return "ignored"
  }

  if (normalized.eventType === "payment.succeeded") {
    if (transaction.status === "pending") {
      try {
        await confirmPendingTransaction(transaction.id, {
          source: "webhook",
        })
      } catch (error) {
        if (!(error instanceof BillingError) || error.statusCode !== 400) {
          throw error
        }
      }
    }

    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "processed",
    })

    return "processed"
  }

  if (normalized.failureReason === "__non_terminal__") {
    await updateWebhookEventStatus({
      eventRowId: input.eventRowId,
      status: "ignored",
    })
    return "ignored"
  }

  if (transaction.status === "pending") {
    await markPendingTransactionAsFailed({
      transactionId: transaction.id,
      invoiceId: transaction.invoiceId,
      reason: normalized.failureReason ?? "Payment failed via webhook",
    })

    await notifyPaymentFailureForInvoice({
      invoiceId: transaction.invoiceId,
      reason: normalized.failureReason ?? "Payment failed via webhook",
    })
  }

  await updateWebhookEventStatus({
    eventRowId: input.eventRowId,
    status: "processed",
  })

  return "processed"
}

