import { and, asc, eq } from "drizzle-orm"
import { db } from "../db.js"
import { planPricing, plans } from "../schema.js"
import { mapPlanRows } from "./plan/shared.js"

export async function listActivePlansWithPricing() {
  const rows = await db
    .select({
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        cpuName: plans.cpuName,
        cpuThreads: plans.cpuThreads,
        ram: plans.ram,
        ramType: plans.ramType,
        storage: plans.storage,
        storageType: plans.storageType,
        bandwidth: plans.bandwidth,
        os: plans.os,
        osVersion: plans.osVersion,
        planType: plans.planType,
        portSpeed: plans.portSpeed,
        setupFees: plans.setupFees,
        planLocation: plans.planLocation,
        isActive: plans.isActive,
        isFeatured: plans.isFeatured,
        defaultPricingId: plans.defaultPricingId,
      },
      pricing: {
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        priceUsdCents: planPricing.priceUsdCents,
        isActive: planPricing.isActive,
        dodoProductId: planPricing.dodoProductId,
        dodoSyncStatus: planPricing.dodoSyncStatus,
        dodoSyncError: planPricing.dodoSyncError,
        dodoSyncedAt: planPricing.dodoSyncedAt,
      },
    })
    .from(plans)
    .innerJoin(planPricing, eq(planPricing.planId, plans.id))
    .where(and(eq(plans.isActive, true), eq(planPricing.isActive, true)))
    .orderBy(asc(plans.id), asc(planPricing.durationDays), asc(planPricing.id))

  return mapPlanRows(rows)
}

export async function listAdminPlansWithPricing() {
  const rows = await db
    .select({
      plan: {
        id: plans.id,
        name: plans.name,
        cpu: plans.cpu,
        cpuName: plans.cpuName,
        cpuThreads: plans.cpuThreads,
        ram: plans.ram,
        ramType: plans.ramType,
        storage: plans.storage,
        storageType: plans.storageType,
        bandwidth: plans.bandwidth,
        os: plans.os,
        osVersion: plans.osVersion,
        planType: plans.planType,
        portSpeed: plans.portSpeed,
        setupFees: plans.setupFees,
        planLocation: plans.planLocation,
        isActive: plans.isActive,
        isFeatured: plans.isFeatured,
        defaultPricingId: plans.defaultPricingId,
      },
      pricing: {
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        priceUsdCents: planPricing.priceUsdCents,
        isActive: planPricing.isActive,
        dodoProductId: planPricing.dodoProductId,
        dodoSyncStatus: planPricing.dodoSyncStatus,
        dodoSyncError: planPricing.dodoSyncError,
        dodoSyncedAt: planPricing.dodoSyncedAt,
      },
    })
    .from(plans)
    .leftJoin(planPricing, eq(planPricing.planId, plans.id))
    .orderBy(asc(plans.id), asc(planPricing.durationDays), asc(planPricing.id))

  return mapPlanRows(rows)
}
