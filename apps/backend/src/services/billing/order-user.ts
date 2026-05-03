import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { invoices, orders } from "../../schema.js"
import { assertOrderHasNoTransactions, validateCouponForOrder } from "./order-coupons.js"
import {
  formatBillingOrderResponse,
  getBillingOrderById,
  getCouponById,
  getOrderInvoice,
} from "./order-query.js"
import { BillingDetailsInput, BillingError } from "./shared.js"

export async function getBillingOrderForUser(userId: number, orderId: number) {
  const record = await getBillingOrderById(orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== userId) {
    throw new BillingError(403, "Forbidden")
  }

  const invoice = await getOrderInvoice(orderId)
  const coupon = await getCouponById(invoice?.couponId)

  return formatBillingOrderResponse({
    ...record,
    invoice: invoice ? { ...invoice, couponCode: coupon?.code ?? null } : invoice,
  })
}

export async function updateBillingDetailsForUser(input: {
  userId: number
  orderId: number
  billingDetails: BillingDetailsInput
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(400, "Billing details can only be updated pre-payment")
  }

  await db
    .update(orders)
    .set({
      billingDetails: input.billingDetails,
    })
    .where(eq(orders.id, input.orderId))

  const updated = await getBillingOrderById(input.orderId)

  if (!updated) {
    throw new BillingError(404, "Order not found")
  }

  return formatBillingOrderResponse(updated)
}

export async function applyCouponToBillingOrder(input: {
  userId: number
  orderId: number
  code: string
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is no longer payable")
  }

  await assertOrderHasNoTransactions(record.order.id)

  const invoice = await getOrderInvoice(record.order.id)

  if (!invoice || invoice.status !== "unpaid") {
    throw new BillingError(400, "Order does not have an unpaid invoice")
  }

  const couponValidation = await validateCouponForOrder({
    userId: input.userId,
    order: record.order,
    code: input.code,
  })

  const discount = couponValidation.discountForSubtotal(invoice.subtotal)

  if (discount < 1) {
    throw new BillingError(400, "Coupon does not reduce this invoice")
  }

  const [updatedInvoice] = await db
    .update(invoices)
    .set({
      discount,
      totalAmount: invoice.subtotal - discount,
      couponId: couponValidation.coupon.id,
    })
    .where(eq(invoices.id, invoice.id))
    .returning()

  return formatBillingOrderResponse({
    ...record,
    invoice: {
      ...(updatedInvoice ?? invoice),
      couponCode: couponValidation.coupon.code,
    },
  })
}

export async function removeCouponFromBillingOrder(input: {
  userId: number
  orderId: number
}) {
  const record = await getBillingOrderById(input.orderId)

  if (!record) {
    throw new BillingError(404, "Order not found")
  }

  if (record.order.userId !== input.userId) {
    throw new BillingError(403, "Forbidden")
  }

  if (record.order.status !== "pending_payment") {
    throw new BillingError(400, "Order is no longer payable")
  }

  await assertOrderHasNoTransactions(record.order.id)

  const invoice = await getOrderInvoice(record.order.id)

  if (!invoice || invoice.status !== "unpaid") {
    throw new BillingError(400, "Order does not have an unpaid invoice")
  }

  const [updatedInvoice] = await db
    .update(invoices)
    .set({
      discount: 0,
      totalAmount: invoice.subtotal,
      couponId: null,
    })
    .where(eq(invoices.id, invoice.id))
    .returning()

  return formatBillingOrderResponse({
    ...record,
    invoice: { ...(updatedInvoice ?? invoice), couponCode: null },
  })
}
