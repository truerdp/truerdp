import type { MarketingPlan, PlanPricingOption } from "./plan-catalog"

export function getLowestPricingOption(
  plan: MarketingPlan
): PlanPricingOption | null {
  if (plan.pricingOptions.length === 0) {
    return null
  }

  return (
    [...plan.pricingOptions].sort(
      (a, b) => a.priceUsdCents - b.priceUsdCents
    )[0] ?? null
  )
}

export function groupPlansBy(
  plans: MarketingPlan[],
  getKey: (plan: MarketingPlan) => string
) {
  return plans.reduce<Record<string, MarketingPlan[]>>((acc, plan) => {
    const key = getKey(plan)
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(plan)
    return acc
  }, {})
}
