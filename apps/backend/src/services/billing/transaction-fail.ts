import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, transactions } from "../../schema.js"
import { createAdminAuditLog } from "../admin-audit.js"
import { notifyPaymentFailureForInvoice } from "./notifications.js"
import { BillingError } from "./shared.js"

export async function failPendingTransactionForUser(input: {
  userId: number
  transactionId: number
  reason: string
  source?: "provider_return" | "webhook" | "system"
}) {
  const failed = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        transaction: {
          id: transactions.id,
          userId: transactions.userId,
          invoiceId: transactions.invoiceId,
          status: transactions.status,
          failureReason: transactions.failureReason,
        },
        invoice: {
          id: invoices.id,
          status: invoices.status,
        },
        order: {
          id: orders.id,
          status: orders.status,
        },
      })
      .from(transactions)
      .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .where(eq(transactions.id, input.transactionId))
      .limit(1)

    if (!current) {
      throw new BillingError(404, "Transaction not found")
    }

    if (current.transaction.userId !== input.userId) {
      throw new BillingError(403, "Forbidden")
    }

    if (current.transaction.status === "confirmed") {
      throw new BillingError(400, "Confirmed transactions cannot be failed")
    }

    if (current.transaction.status === "failed") {
      return {
        transaction: current.transaction,
        invoice: current.invoice,
        order: current.order,
        changed: false,
      }
    }

    await tx
      .update(transactions)
      .set({
        status: "failed",
        failureReason: input.reason,
      })
      .where(eq(transactions.id, current.transaction.id))

    await tx
      .update(invoices)
      .set({
        status: "expired",
      })
      .where(eq(invoices.id, current.invoice.id))

    await tx
      .update(orders)
      .set({
        status: "cancelled",
      })
      .where(eq(orders.id, current.order.id))

    return {
      transaction: {
        ...current.transaction,
        status: "failed" as const,
        failureReason: input.reason,
      },
      invoice: {
        ...current.invoice,
        status: "expired" as const,
      },
      order: {
        ...current.order,
        status: "cancelled" as const,
      },
      changed: true,
    }
  })

  if (failed.changed) {
    await notifyPaymentFailureForInvoice({
      invoiceId: failed.invoice.id,
      reason: input.reason,
    })

    try {
      await createAdminAuditLog({
        adminUserId: null,
        action: "transaction.fail",
        entityType: "transaction",
        entityId: failed.transaction.id,
        reason: input.reason,
        beforeState: {
          transactionStatus: "pending",
          invoiceStatus: "unpaid",
          orderStatus: "pending_payment",
        },
        afterState: {
          transactionStatus: failed.transaction.status,
          invoiceStatus: failed.invoice.status,
          orderStatus: failed.order.status,
        },
        metadata: {
          source: input.source ?? "system",
        },
      })
    } catch (auditError) {
      console.error("Failed to write transaction failure audit log", auditError)
    }
  }

  return failed
}
