import { and, asc, eq, sql } from "drizzle-orm"
import { db } from "../db.js"
import { cartItems, planPricing, plans } from "../schema.js"
import { getEffectivePlanPriceUsdCents } from "./plan/pricing.js"
import { BillingError } from "./billing/shared.js"

const maxCartQuantity = 99

export type CartLine = {
  id: number
  planPricingId: number
  planId: number
  planName: string
  planType: string
  planLocation: string
  cpu: number
  ram: number
  storage: number
  durationDays: number
  priceUsdCents: number
  originalPriceUsdCents: number
  quantity: number
  lineTotalUsdCents: number
}

function normalizeQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new BillingError(400, "Quantity must be a positive integer")
  }

  return Math.min(quantity, maxCartQuantity)
}

function formatCartResponse(items: CartLine[]) {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotalUsdCents = items.reduce(
    (total, item) => total + item.lineTotalUsdCents,
    0
  )

  return {
    items,
    itemCount,
    subtotalUsdCents,
  }
}

export async function listCartLines(userId: number) {
  const rows = await db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
      planPricingId: cartItems.planPricingId,
      planId: plans.id,
      planName: plans.name,
      planType: plans.planType,
      planLocation: plans.planLocation,
      cpu: plans.cpu,
      ram: plans.ram,
      storage: plans.storage,
      durationDays: planPricing.durationDays,
      priceUsdCents: planPricing.priceUsdCents,
      promoPriceUsdCents: planPricing.promoPriceUsdCents,
      planIsActive: plans.isActive,
      pricingIsActive: planPricing.isActive,
    })
    .from(cartItems)
    .innerJoin(planPricing, eq(cartItems.planPricingId, planPricing.id))
    .innerJoin(plans, eq(cartItems.planId, plans.id))
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.createdAt), asc(cartItems.id))

  return rows.map((row) => {
    const priceUsdCents = getEffectivePlanPriceUsdCents({
      priceUsdCents: row.priceUsdCents,
      promoPriceUsdCents: row.promoPriceUsdCents,
    })

    return {
      id: row.id,
      planPricingId: row.planPricingId,
      planId: row.planId,
      planName: row.planName,
      planType: row.planType,
      planLocation: row.planLocation,
      cpu: row.cpu,
      ram: row.ram,
      storage: row.storage,
      durationDays: row.durationDays,
      priceUsdCents,
      originalPriceUsdCents: row.priceUsdCents,
      quantity: row.quantity,
      lineTotalUsdCents: priceUsdCents * row.quantity,
      isActive: row.planIsActive && row.pricingIsActive,
    }
  })
}

export async function getCartForUser(userId: number) {
  const lines = await listCartLines(userId)
  return formatCartResponse(
    lines.map((line) => ({
      id: line.id,
      planPricingId: line.planPricingId,
      planId: line.planId,
      planName: line.planName,
      planType: line.planType,
      planLocation: line.planLocation,
      cpu: line.cpu,
      ram: line.ram,
      storage: line.storage,
      durationDays: line.durationDays,
      priceUsdCents: line.priceUsdCents,
      originalPriceUsdCents: line.originalPriceUsdCents,
      quantity: line.quantity,
      lineTotalUsdCents: line.lineTotalUsdCents,
    }))
  )
}

export async function addCartItem(input: {
  userId: number
  planPricingId: number
  quantity?: number
}) {
  const quantity = normalizeQuantity(input.quantity ?? 1)

  const [selection] = await db
    .select({
      planId: plans.id,
      planIsActive: plans.isActive,
      pricingIsActive: planPricing.isActive,
    })
    .from(planPricing)
    .innerJoin(plans, eq(planPricing.planId, plans.id))
    .where(eq(planPricing.id, input.planPricingId))
    .limit(1)

  if (!selection || !selection.pricingIsActive || !selection.planIsActive) {
    throw new BillingError(400, "Selected plan is unavailable")
  }

  await db
    .insert(cartItems)
    .values({
      userId: input.userId,
      planId: selection.planId,
      planPricingId: input.planPricingId,
      quantity,
    })
    .onConflictDoUpdate({
      target: [cartItems.userId, cartItems.planPricingId],
      set: {
        quantity: sql`least(${cartItems.quantity} + ${quantity}, ${maxCartQuantity})`,
        updatedAt: new Date(),
      },
    })

  return getCartForUser(input.userId)
}

export async function updateCartItemQuantity(input: {
  userId: number
  cartItemId: number
  quantity: number
}) {
  const quantity = normalizeQuantity(input.quantity)

  const updated = await db
    .update(cartItems)
    .set({ quantity })
    .where(
      and(
        eq(cartItems.id, input.cartItemId),
        eq(cartItems.userId, input.userId)
      )
    )
    .returning({ id: cartItems.id })

  if (!updated[0]) {
    throw new BillingError(404, "Cart item not found")
  }

  return getCartForUser(input.userId)
}

export async function removeCartItem(input: {
  userId: number
  cartItemId: number
}) {
  await db
    .delete(cartItems)
    .where(
      and(
        eq(cartItems.id, input.cartItemId),
        eq(cartItems.userId, input.userId)
      )
    )

  return getCartForUser(input.userId)
}

export async function clearCartForUser(userId: number) {
  await db.delete(cartItems).where(eq(cartItems.userId, userId))
  return getCartForUser(userId)
}
