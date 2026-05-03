import { and, asc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing, plans, transactions } from "../../schema.js"

export async function getDefaultPlanPricingForPlan(planId: number) {
  const pricingOptions = await db
    .select({
      id: planPricing.id,
      planId: planPricing.planId,
      durationDays: planPricing.durationDays,
      priceUsdCents: planPricing.priceUsdCents,
      isActive: planPricing.isActive,
    })
    .from(planPricing)
    .where(and(eq(planPricing.planId, planId), eq(planPricing.isActive, true)))
    .orderBy(asc(planPricing.durationDays), asc(planPricing.id))
    .limit(1)

  return pricingOptions[0] ?? null
}

export async function getPlanPricingById(planPricingId: number) {
  const pricingOptions = await db
    .select({
      id: planPricing.id,
      planId: planPricing.planId,
      durationDays: planPricing.durationDays,
      priceUsdCents: planPricing.priceUsdCents,
      isActive: planPricing.isActive,
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
        isActive: plans.isActive,
      },
    })
    .from(planPricing)
    .innerJoin(plans, eq(planPricing.planId, plans.id))
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  return pricingOptions[0] ?? null
}

export async function findPendingTransactionForInstance(
  userId: number,
  instanceId: number
) {
  const pendingTransactions = await db
    .select({
      id: transactions.id,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.instanceId, instanceId),
        eq(transactions.status, "pending")
      )
    )
    .limit(1)

  return pendingTransactions[0] ?? null
}
