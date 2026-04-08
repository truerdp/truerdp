import { db } from "../db.js"
import { planPricing, users } from "../schema.js"
import { eq } from "drizzle-orm"

export async function calculatePrice(userId: number, planPricingId: number) {
  const pricingResult = await db
    .select()
    .from(planPricing)
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  const pricing = pricingResult[0]

  if (!pricing) {
    throw new Error("Invalid plan pricing")
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userResult[0]

  if (!user) {
    throw new Error("User not found")
  }

  let amount = pricing.price

  if (user.discountPercent) {
    amount = amount - (amount * user.discountPercent) / 100
  }

  if (user.discountFlat) {
    amount = amount - user.discountFlat
  }

  if (amount < 0) amount = 0

  return amount
}
