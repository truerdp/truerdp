import type { Plan, PlanPricingOption } from "@/components/landing/sections"

const fallbackJourneyDetails: Record<string, string[]> = {
  choose: [
    "Start with plan type, location, and resource requirements.",
    "Review available durations and starting price before checkout.",
    "Use the comparison table if you need to scan every spec side-by-side.",
  ],
  checkout: [
    "Confirm the selected duration and plan price.",
    "Sign in or create an account so the order stays attached to you.",
    "Move into the secure payment review flow without repeating plan details.",
  ],
  provision: [
    "Payment confirmation creates the provisioning request for the team.",
    "Support assigns the matching RDP resources from available inventory.",
    "Access details and next steps are handled through the customer flow.",
  ],
}

function getLowestPricingOption(plan: Plan): PlanPricingOption | null {
  if (plan.pricingOptions.length === 0) {
    return null
  }

  return (
    [...plan.pricingOptions].sort(
      (a, b) => a.priceUsdCents - b.priceUsdCents
    )[0] ?? null
  )
}

function readText(value: unknown, fallback: string) {
  return typeof value === "string" && value ? value : fallback
}

function readRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {}
}

function getJourneyDetails(item: Record<string, unknown>, title: string) {
  const details = Array.isArray(item.details)
    ? item.details.filter(
        (detail): detail is string => typeof detail === "string"
      )
    : []

  if (details.length > 0) {
    return details
  }

  return fallbackJourneyDetails[title.toLowerCase()] ?? []
}

export {
  fallbackJourneyDetails,
  getJourneyDetails,
  getLowestPricingOption,
  readRecord,
  readText,
}
