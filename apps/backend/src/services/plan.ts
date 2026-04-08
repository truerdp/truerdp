import { and, asc, eq } from "drizzle-orm"
import { db } from "../db.js"
import { planPricing, plans } from "../schema.js"

export async function listActivePlansWithPricing() {
  const rows = await db
    .select({
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        ram: plans.ram,
        storage: plans.storage,
      },
      pricing: {
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        price: planPricing.price,
      },
    })
    .from(plans)
    .innerJoin(planPricing, eq(planPricing.planId, plans.id))
    .where(and(eq(plans.isActive, true), eq(planPricing.isActive, true)))
    .orderBy(asc(plans.id), asc(planPricing.durationDays), asc(planPricing.id))

  const planMap = new Map<
    number,
    {
      id: number
      name: string
      cpu: number
      ram: number
      storage: number
      defaultPricingId: number | null
      pricingOptions: Array<{
        id: number
        durationDays: number
        price: number
      }>
    }
  >()

  for (const row of rows) {
    const current =
      planMap.get(row.plan.id) ??
      (() => {
        const next = {
          id: row.plan.id,
          name: row.plan.name,
          cpu: row.plan.cpu,
          ram: row.plan.ram,
          storage: row.plan.storage,
          defaultPricingId: null,
          pricingOptions: [] as Array<{
            id: number
            durationDays: number
            price: number
          }>,
        }

        planMap.set(row.plan.id, next)
        return next
      })()

    current.pricingOptions.push({
      id: row.pricing.id,
      durationDays: row.pricing.durationDays,
      price: row.pricing.price,
    })

    if (current.defaultPricingId == null) {
      current.defaultPricingId = row.pricing.id
    }
  }

  return Array.from(planMap.values())
}
