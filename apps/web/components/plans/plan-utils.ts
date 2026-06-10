import type { MarketingPlan, PlanPricingOption } from "./plan-catalog"

export function getEffectivePriceUsdCents(pricing: PlanPricingOption) {
  return pricing.promoPriceUsdCents != null &&
    pricing.promoPriceUsdCents < pricing.priceUsdCents
    ? pricing.promoPriceUsdCents
    : pricing.priceUsdCents
}

export function getLowestPricingOption(
  plan: MarketingPlan
): PlanPricingOption | null {
  if (plan.pricingOptions.length === 0) {
    return null
  }

  return (
    [...plan.pricingOptions].sort(
      (a, b) => getEffectivePriceUsdCents(a) - getEffectivePriceUsdCents(b)
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
