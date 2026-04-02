import { db } from "../db.js"
import { plans, users } from "../schema.js"
import { eq } from "drizzle-orm"

export async function calculatePrice(userId: number, planId: number) {
  // ✅ Get plan
  const planResult = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1)

  const plan = planResult[0]

  if (!plan) {
    throw new Error("Invalid plan")
  }

  // ✅ Get user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userResult[0]

  if (!user) {
    throw new Error("User not found")
  }

  // ✅ Calculate price
  let amount = plan.price

  if (user.discountPercent) {
    amount = amount - (amount * user.discountPercent) / 100
  }

  if (user.discountFlat) {
    amount = amount - user.discountFlat
  }

  if (amount < 0) amount = 0

  return amount
}
