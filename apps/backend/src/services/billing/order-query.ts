import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { coupons, invoices, orders, plans } from "../../schema.js"
import { getOrderPlanPriceUsdCents } from "./shared.js"

export type BillingOrderRecord = {
  order: typeof orders.$inferSelect
  invoice?:
    | (typeof invoices.$inferSelect & { couponCode?: string | null })
    | null
  plan: {
    id: number
    name: string
    cpu: number
    ram: number
    storage: number
  }
}

export function formatBillingOrderResponse(record: BillingOrderRecord) {
  const planPriceUsdCents = getOrderPlanPriceUsdCents(record.order)

  return {
    orderId: record.order.id,
    userId: record.order.userId,
    kind: record.order.kind,
    status: record.order.status,
    createdAt: record.order.createdAt,
    updatedAt: record.order.updatedAt,
    billingDetails: record.order.billingDetails,
    plan: {
      id: record.plan.id,
      name: record.order.planName,
      cpu: record.plan.cpu,
      ram: record.plan.ram,
      storage: record.plan.storage,
    },
    pricing: {
      id: record.order.planPricingId,
      durationDays: record.order.durationDays,
      priceUsdCents: planPriceUsdCents,
    },
    invoice: record.invoice
      ? {
          id: record.invoice.id,
          invoiceNumber: record.invoice.invoiceNumber,
          subtotal: record.invoice.subtotal,
          discount: record.invoice.discount,
          totalAmount: record.invoice.totalAmount,
          currency: record.invoice.currency,
          couponId: record.invoice.couponId,
          couponCode: record.invoice.couponCode ?? null,
          status: record.invoice.status,
          expiresAt: record.invoice.expiresAt,
          paidAt: record.invoice.paidAt,
        }
      : null,
  }
}

export async function getOrderInvoice(orderId: number) {
  const invoiceResult = await db
    .select()
    .from(invoices)
    .where(eq(invoices.orderId, orderId))
    .limit(1)

  return invoiceResult[0] ?? null
}

export async function getCouponById(couponId: number | null | undefined) {
  if (!couponId) {
    return null
  }

  const [coupon] = await db
    .select({
      code: coupons.code,
      type: coupons.type,
      value: coupons.value,
      maxUses: coupons.maxUses,
      expiresAt: coupons.expiresAt,
    })
    .from(coupons)
    .where(eq(coupons.id, couponId))
    .limit(1)

  return coupon ?? null
}

export async function getBillingOrderById(orderId: number) {
  const orderResult = await db
    .select({
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
        name: plans.name,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
    })
    .from(orders)
    .innerJoin(plans, eq(orders.planId, plans.id))
    .where(eq(orders.id, orderId))
    .limit(1)

  return orderResult[0] ?? null
}
