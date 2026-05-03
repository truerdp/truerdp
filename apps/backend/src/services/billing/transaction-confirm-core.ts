import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { couponUsages, instances, invoices, orders, transactions } from "../../schema.js"
import { BillingError } from "./shared.js"

export async function confirmPendingTransactionCore(transactionId: number) {
  return db.transaction(async (tx) => {
    const txResult = await tx
      .select({
        transaction: {
          id: transactions.id,
          userId: transactions.userId,
          invoiceId: transactions.invoiceId,
          instanceId: transactions.instanceId,
          amount: transactions.amount,
          method: transactions.method,
          status: transactions.status,
        },
        invoice: {
          id: invoices.id,
          status: invoices.status,
          couponId: invoices.couponId,
        },
        order: {
          id: orders.id,
          kind: orders.kind,
          planId: orders.planId,
          planPricingId: orders.planPricingId,
          durationDays: orders.durationDays,
          status: orders.status,
        },
      })
      .from(transactions)
      .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .where(eq(transactions.id, transactionId))
      .limit(1)

    const current = txResult[0]

    if (!current) {
      throw new BillingError(404, "Transaction not found")
    }

    if (current.transaction.status !== "pending") {
      throw new BillingError(400, "Already processed")
    }

    if (current.invoice.status === "paid") {
      throw new BillingError(400, "Invoice already paid")
    }

    const now = new Date()
    let instance = null
    let orderStatus: "processing" | "completed" = "processing"

    if (current.order.kind === "renewal") {
      if (!current.transaction.instanceId) {
        throw new BillingError(400, "Renewal transaction missing instanceId")
      }

      const instanceResult = await tx
        .select()
        .from(instances)
        .where(eq(instances.id, current.transaction.instanceId))
        .limit(1)

      const existingInstance = instanceResult[0]

      if (!existingInstance) {
        throw new BillingError(404, "Instance not found")
      }

      if (existingInstance.userId !== current.transaction.userId) {
        throw new BillingError(403, "Forbidden")
      }

      if (existingInstance.status === "terminated") {
        throw new BillingError(400, "Cannot renew a terminated instance")
      }

      if (existingInstance.status === "suspended") {
        throw new BillingError(400, "Cannot renew a suspended instance")
      }

      const baseDate =
        existingInstance.expiryDate && existingInstance.expiryDate > now
          ? existingInstance.expiryDate
          : now

      const newExpiryDate = new Date(baseDate)
      newExpiryDate.setDate(newExpiryDate.getDate() + current.order.durationDays)

      const updatedInstance = await tx
        .update(instances)
        .set({
          expiryDate: newExpiryDate,
          status: "active",
        })
        .where(eq(instances.id, existingInstance.id))
        .returning()

      instance = updatedInstance[0] ?? null
      orderStatus = "completed"
    } else {
      const createdInstance = await tx
        .insert(instances)
        .values({
          userId: current.transaction.userId,
          originOrderId: current.order.id,
          planId: current.order.planId,
          status: "provisioning",
        })
        .returning()

      instance = createdInstance[0] ?? null
    }

    await tx
      .update(transactions)
      .set({
        instanceId: instance?.id ?? current.transaction.instanceId ?? null,
        status: "confirmed",
        confirmedAt: now,
      })
      .where(eq(transactions.id, current.transaction.id))

    await tx
      .update(invoices)
      .set({
        status: "paid",
        paidAt: now,
      })
      .where(eq(invoices.id, current.invoice.id))

    await tx
      .update(orders)
      .set({
        status: orderStatus,
      })
      .where(eq(orders.id, current.order.id))

    if (current.invoice.couponId) {
      await tx
        .insert(couponUsages)
        .values({
          couponId: current.invoice.couponId,
          userId: current.transaction.userId,
          invoiceId: current.invoice.id,
        })
        .onConflictDoNothing()
    }

    return {
      message:
        current.order.kind === "renewal"
          ? "Renewal successful. Instance extended."
          : "Payment confirmed. Instance is ready for provisioning.",
      instance,
      order: {
        id: current.order.id,
        status: orderStatus,
      },
      invoice: {
        id: current.invoice.id,
        status: "paid" as const,
      },
      transaction: {
        id: current.transaction.id,
        status: "confirmed" as const,
        confirmedAt: now,
      },
      kind: current.order.kind,
      before: {
        transactionStatus: current.transaction.status,
        invoiceStatus: current.invoice.status,
        orderStatus: current.order.status,
      },
    }
  })
}
