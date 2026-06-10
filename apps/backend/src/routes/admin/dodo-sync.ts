import { eq } from "drizzle-orm"

import { db } from "../../db.js"
import { coupons, planPricing } from "../../schema.js"
import {
  syncDodoDiscountForCoupon,
  syncDodoProductForPlanPricing,
} from "../../services/dodo-payments.js"
import { getEffectivePlanPriceUsdCents } from "../../services/plan/pricing.js"
import { getErrorMessage } from "../../utils/error.js"

export type DodoSyncResult = {
  status: "synced" | "failed"
  error: string | null
}

export type PlanPricingSyncTarget = {
  id: number
  planName: string
  durationDays: number
  priceUsdCents: number
  promoPriceUsdCents: number | null
  dodoProductId: string | null
}

type CouponSyncTarget = typeof coupons.$inferSelect

export async function syncPlanPricingToDodo(
  pricing: PlanPricingSyncTarget
): Promise<DodoSyncResult> {
  try {
    const syncResult = await syncDodoProductForPlanPricing({
      planPricingId: pricing.id,
      planName: pricing.planName,
      durationDays: pricing.durationDays,
      priceUsdCents: getEffectivePlanPriceUsdCents(pricing),
      existingDodoProductId: pricing.dodoProductId,
    })

    await db
      .update(planPricing)
      .set({
        dodoProductId: syncResult.dodoProductId,
        dodoSyncStatus: "synced",
        dodoSyncError: null,
        dodoSyncedAt: syncResult.syncedAt,
      })
      .where(eq(planPricing.id, pricing.id))

    return { status: "synced", error: null }
  } catch (error: unknown) {
    const message = getErrorMessage(error)

    await db
      .update(planPricing)
      .set({
        dodoSyncStatus: "failed",
        dodoSyncError: message,
      })
      .where(eq(planPricing.id, pricing.id))

    return { status: "failed", error: message }
  }
}

export async function syncCouponToDodo(
  coupon: CouponSyncTarget
): Promise<DodoSyncResult> {
  try {
    const syncResult = await syncDodoDiscountForCoupon({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      maxUses: coupon.maxUses,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
      existingDodoDiscountId: coupon.dodoDiscountId,
    })

    await db
      .update(coupons)
      .set({
        dodoDiscountId: syncResult.dodoDiscountId,
        dodoSyncStatus: "synced",
        dodoSyncError: null,
        dodoSyncedAt: syncResult.syncedAt,
      })
      .where(eq(coupons.id, coupon.id))

    return { status: "synced", error: null }
  } catch (error: unknown) {
    const message = getErrorMessage(error)

    await db
      .update(coupons)
      .set({
        dodoSyncStatus: "failed",
        dodoSyncError: message,
      })
      .where(eq(coupons.id, coupon.id))

    return { status: "failed", error: message }
  }
}
