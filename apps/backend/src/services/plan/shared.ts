export type PlanPricingOption = {
  id: number
  durationDays: number
  priceUsdCents: number
  isActive: boolean
  dodoProductId: string | null
  dodoSyncStatus: "pending" | "synced" | "failed"
  dodoSyncError: string | null
  dodoSyncedAt: Date | null
}

type PlanRow = {
  id: number
  name: string
  cpu: number
  cpuName: string
  cpuThreads: number
  ram: number
  ramType: string
  storage: number
  storageType: string
  bandwidth: string
  os: string
  osVersion: string
  planType: string
  portSpeed: string
  setupFees: number
  planLocation: string
  isActive: boolean
  isFeatured: boolean
  defaultPricingId: number | null
}

type PlanPricingJoinRow = {
  plan: PlanRow
  pricing: PlanPricingOption | null
}

export interface PlanWithPricing extends PlanRow {
  pricingOptions: PlanPricingOption[]
}

export function mapPlanRows(rows: PlanPricingJoinRow[]) {
  const planMap = new Map<number, PlanWithPricing>()

  for (const row of rows) {
    const current =
      planMap.get(row.plan.id) ??
      (() => {
        const next: PlanWithPricing = {
          ...row.plan,
          pricingOptions: [],
        }

        planMap.set(row.plan.id, next)
        return next
      })()

    if (row.pricing) {
      current.pricingOptions.push({
        id: row.pricing.id,
        durationDays: row.pricing.durationDays,
        priceUsdCents: row.pricing.priceUsdCents,
        isActive: row.pricing.isActive,
        dodoProductId: row.pricing.dodoProductId,
        dodoSyncStatus: row.pricing.dodoSyncStatus,
        dodoSyncError: row.pricing.dodoSyncError,
        dodoSyncedAt: row.pricing.dodoSyncedAt,
      })
    }
  }

  for (const plan of planMap.values()) {
    plan.pricingOptions.sort((a, b) => {
      if (a.durationDays !== b.durationDays) {
        return a.durationDays - b.durationDays
      }

      return a.id - b.id
    })

    if (!plan.defaultPricingId) {
      const defaultPricing = plan.pricingOptions.find((option) => option.isActive)
      plan.defaultPricingId = defaultPricing?.id ?? null
    }
  }

  return Array.from(planMap.values())
}
