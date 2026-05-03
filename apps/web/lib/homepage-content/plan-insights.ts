import type { Plan } from "@/components/landing/sections"
import { getLowestPricingOption } from "@/lib/homepage-content/utils"

export function buildPlanInsights(plans: Plan[]) {
  const sortedPlans = [...plans].sort((a, b) => {
    const lowestA =
      getLowestPricingOption(a)?.priceUsdCents ?? Number.MAX_SAFE_INTEGER
    const lowestB =
      getLowestPricingOption(b)?.priceUsdCents ?? Number.MAX_SAFE_INTEGER
    return lowestA - lowestB
  })

  const featuredPlans = sortedPlans.filter((plan) => plan.isFeatured)
  const cheapestPlan = sortedPlans[0]
  const cheapestOption = cheapestPlan
    ? getLowestPricingOption(cheapestPlan)
    : null
  const uniqueLocations = new Set(plans.map((plan) => plan.planLocation)).size
  const uniqueTypes = new Set(plans.map((plan) => plan.planType)).size

  const planCountLabel =
    plans.length === 0
      ? "No active plans"
      : `${plans.length} active plan${plans.length > 1 ? "s" : ""}`

  const plansByLocation = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    const key = plan.planLocation

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(plan)
    return acc
  }, {})

  return {
    featuredPlans,
    cheapestOption,
    uniqueLocations,
    uniqueTypes,
    planCountLabel,
    plansByLocation,
  }
}
