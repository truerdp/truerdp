import { and, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders, transactions, users } from "../../schema.js"
import {
  sendAdminAlertEmail,
  sendInvoiceCreatedEmail,
  sendPaymentConfirmedEmail,
  sendPaymentFailedEmail,
} from "../email.js"
import { formatEmailAmount } from "./shared.js"

export async function sendInvoiceCreatedNotification(invoiceId: number) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        expiresAt: invoices.expiresAt,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1)

  if (!record) {
    return
  }

  try {
    await sendInvoiceCreatedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceId: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      planName: record.order.planName,
      amount: formatEmailAmount(record.invoice.totalAmount, record.invoice.currency),
      expiresAt: record.invoice.expiresAt,
    })
  } catch (emailError) {
    console.error("Failed to send invoice created email", emailError)
  }
}

export async function sendPaymentConfirmedNotification(input: {
  invoiceId: number
  transactionId: number
}) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
        paidAt: invoices.paidAt,
      },
      transaction: {
        reference: transactions.reference,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(
      transactions,
      and(
        eq(transactions.id, input.transactionId),
        eq(transactions.invoiceId, invoices.id)
      )
    )
    .where(eq(invoices.id, input.invoiceId))
    .limit(1)

  if (!record || !record.invoice.paidAt) {
    return
  }

  try {
    await sendPaymentConfirmedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceId: record.invoice.id,
      invoiceNumber: record.invoice.invoiceNumber,
      transactionReference: record.transaction.reference,
      planName: record.order.planName,
      amount: formatEmailAmount(record.invoice.totalAmount, record.invoice.currency),
      paidAt: record.invoice.paidAt,
    })
  } catch (emailError) {
    console.error("Failed to send payment confirmed email", emailError)
  }
}

export async function sendPaymentFailedNotification(input: {
  invoiceId: number
  reason: string
}) {
  const [record] = await db
    .select({
      invoice: {
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: invoices.totalAmount,
        currency: invoices.currency,
      },
      order: {
        planName: orders.planName,
      },
      user: {
        email: users.email,
        firstName: users.firstName,
      },
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .innerJoin(users, eq(orders.userId, users.id))
    .where(eq(invoices.id, input.invoiceId))
    .limit(1)

  if (!record) {
    return
  }

  try {
    await sendPaymentFailedEmail({
      to: record.user.email,
      firstName: record.user.firstName,
      invoiceNumber: record.invoice.invoiceNumber,
      invoiceId: record.invoice.id,
      planName: record.order.planName,
      amount: formatEmailAmount(record.invoice.totalAmount, record.invoice.currency),
      reason: input.reason,
    })
  } catch (emailError) {
    console.error("Failed to send payment failed email", emailError)
  }
}

export async function notifyPaymentFailureForInvoice(input: {
  invoiceId: number
  reason: string
}) {
  await sendPaymentFailedNotification({
    invoiceId: input.invoiceId,
    reason: input.reason,
  })

  try {
    await sendAdminAlertEmail({
      subject: `Payment failed for invoice #${input.invoiceId}`,
      text: `Invoice #${input.invoiceId} moved to failed/expired state. Reason: ${input.reason}`,
    })
  } catch (alertError) {
    console.error("Failed to send admin alert for payment failure", alertError)
  }
}
