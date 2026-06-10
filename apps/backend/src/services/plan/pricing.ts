type PlanPricingLike = {
  priceUsdCents: number
  promoPriceUsdCents?: number | null
}

export function getEffectivePlanPriceUsdCents(pricing: PlanPricingLike) {
  if (
    pricing.promoPriceUsdCents != null &&
    pricing.promoPriceUsdCents >= 0 &&
    pricing.promoPriceUsdCents < pricing.priceUsdCents
  ) {
    return pricing.promoPriceUsdCents
  }

  return pricing.priceUsdCents
}
