import { db } from "../db.js"
import { planPricing } from "../schema.js"
import { eq } from "drizzle-orm"

export async function calculatePrice(_userId: number, planPricingId: number) {
  const pricingResult = await db
    .select()
    .from(planPricing)
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  const pricing = pricingResult[0]

  if (!pricing) {
    throw new Error("Invalid plan pricing")
  }

  return pricing.priceUsdCents
}
