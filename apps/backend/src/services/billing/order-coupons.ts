import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "../../db.js"
import { couponUsages, coupons, invoices, orders, transactions } from "../../schema.js"
import { BillingError } from "./shared.js"

export async function assertOrderHasNoTransactions(orderId: number) {
  const existingTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.orderId, orderId),
        inArray(transactions.status, ["pending", "confirmed"])
      )
    )
    .limit(1)

  if (existingTransactions[0]) {
    throw new BillingError(
      400,
      "Coupon cannot be changed after payment has started"
    )
  }
}

function calculateCouponDiscount(input: {
  subtotal: number
  type: "percent" | "flat"
  value: number
}) {
  if (input.type === "percent") {
    if (input.value < 1 || input.value > 100) {
      throw new BillingError(400, "Percent coupon value must be 1-100")
    }

    return Math.floor((input.subtotal * input.value) / 100)
  }

  if (input.value < 1) {
    throw new BillingError(400, "Flat coupon value must be greater than zero")
  }

  return input.value
}

export async function validateCouponForOrder(input: {
  userId: number
  order: typeof orders.$inferSelect
  code: string
}) {
  const normalizedCode = input.code.trim().toUpperCase()

  if (!normalizedCode) {
    throw new BillingError(400, "Coupon code is required")
  }

  const couponResult = await db
    .select()
    .from(coupons)
    .where(sql`upper(${coupons.code}) = ${normalizedCode}`)
    .limit(1)

  const coupon = couponResult[0]

  if (!coupon || !coupon.isActive) {
    throw new BillingError(400, "Coupon is not valid")
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new BillingError(400, "Coupon has expired")
  }

  if (coupon.appliesTo !== "all" && coupon.appliesTo !== input.order.kind) {
    throw new BillingError(400, "Coupon is not valid for this order")
  }

  const existingUsage = await db
    .select({ id: couponUsages.id })
    .from(couponUsages)
    .where(
      and(eq(couponUsages.couponId, coupon.id), eq(couponUsages.userId, input.userId))
    )
    .limit(1)

  if (existingUsage[0]) {
    throw new BillingError(400, "Coupon has already been used")
  }

  if (coupon.maxUses != null) {
    const usageCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, coupon.id))

    const usageCount = usageCountResult[0]?.count ?? 0

    if (usageCount >= coupon.maxUses) {
      throw new BillingError(400, "Coupon usage limit has been reached")
    }
  }

  return {
    coupon,
    discountForSubtotal(subtotal: number) {
      return Math.min(
        subtotal - 1,
        calculateCouponDiscount({
          subtotal,
          type: coupon.type,
          value: coupon.value,
        })
      )
    },
  }
}
