import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing } from "../../schema.js"
import { getDefaultCurrency, getDodoClient, getTaxCategory } from "./shared.js"

function buildDodoProductName(input: { planName: string; durationDays: number }) {
  const name = `${input.planName} (${input.durationDays} days)`
  if (name.length <= 100) return name
  return `${name.slice(0, 97)}...`
}

function buildDodoProductPayload(input: {
  planPricingId: number
  planName: string
  durationDays: number
  priceUsdCents: number
}) {
  return {
    name: buildDodoProductName({
      planName: input.planName,
      durationDays: input.durationDays,
    }),
    description: `Auto-synced from admin plan pricing #${input.planPricingId}`,
    tax_category: getTaxCategory(),
    metadata: {
      source: "admin_plan_sync",
      plan_pricing_id: String(input.planPricingId),
      duration_days: String(input.durationDays),
    },
    price: {
      type: "one_time_price",
      currency: getDefaultCurrency(),
      discount: 0,
      price: input.priceUsdCents,
      purchasing_power_parity: false,
    },
  }
}

export async function syncDodoProductForPlanPricing(input: {
  planPricingId: number
  planName: string
  durationDays: number
  priceUsdCents: number
  existingDodoProductId?: string | null
}) {
  const client = getDodoClient()
  const payload = buildDodoProductPayload(input)

  if (input.existingDodoProductId) {
    await client.products.update(input.existingDodoProductId, payload)
    return {
      dodoProductId: input.existingDodoProductId,
      syncedAt: new Date(),
    }
  }

  const created = await client.products.create(payload)
  const dodoProductId = created.product_id

  if (!dodoProductId) {
    throw new Error(
      `Dodo product create response missing product_id for planPricingId=${input.planPricingId}`
    )
  }

  return {
    dodoProductId,
    syncedAt: new Date(),
  }
}

export async function resolveDodoProductIdForPlanPricing(planPricingId: number) {
  const [pricing] = await db
    .select({
      dodoProductId: planPricing.dodoProductId,
      dodoSyncStatus: planPricing.dodoSyncStatus,
    })
    .from(planPricing)
    .where(eq(planPricing.id, planPricingId))
    .limit(1)

  if (!pricing) {
    throw new Error(`Plan pricing ${planPricingId} not found`)
  }

  if (!pricing.dodoProductId) {
    throw new Error(
      `No Dodo product is synced for planPricingId=${planPricingId}. Update the plan in admin to trigger sync.`
    )
  }

  if (pricing.dodoSyncStatus !== "synced") {
    throw new Error(
      `Dodo product sync status is ${pricing.dodoSyncStatus} for planPricingId=${planPricingId}`
    )
  }

  return pricing.dodoProductId
}

