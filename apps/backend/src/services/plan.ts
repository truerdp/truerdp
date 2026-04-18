import { and, asc, eq } from "drizzle-orm"
import { db } from "../db.js"
import { planPricing, plans } from "../schema.js"

interface PlanWithPricing {
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
  defaultPricingId: number | null
  pricingOptions: Array<{
    id: number
    durationDays: number
    price: number
    isActive: boolean
  }>
}

function mapPlanRows(
  rows: Array<{
    plan: {
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
      defaultPricingId: number | null
    }
    pricing: {
      id: number
      durationDays: number
      price: number
      isActive: boolean
    } | null
  }>
) {
  const planMap = new Map<number, PlanWithPricing>()

  for (const row of rows) {
    const current =
      planMap.get(row.plan.id) ??
      (() => {
        const next: PlanWithPricing = {
          id: row.plan.id,
          name: row.plan.name,
          cpu: row.plan.cpu,
          cpuName: row.plan.cpuName,
          cpuThreads: row.plan.cpuThreads,
          ram: row.plan.ram,
          ramType: row.plan.ramType,
          storage: row.plan.storage,
          storageType: row.plan.storageType,
          bandwidth: row.plan.bandwidth,
          os: row.plan.os,
          osVersion: row.plan.osVersion,
          planType: row.plan.planType,
          portSpeed: row.plan.portSpeed,
          setupFees: row.plan.setupFees,
          planLocation: row.plan.planLocation,
          isActive: row.plan.isActive,
          defaultPricingId: row.plan.defaultPricingId,
          pricingOptions: [],
        }

        planMap.set(row.plan.id, next)
        return next
      })()

    if (row.pricing) {
      current.pricingOptions.push({
        id: row.pricing.id,
        durationDays: row.pricing.durationDays,
        price: row.pricing.price,
        isActive: row.pricing.isActive,
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

    // Use explicit defaultPricingId if set, otherwise fall back to first active option
    if (!plan.defaultPricingId) {
      const defaultPricing = plan.pricingOptions.find(
        (option) => option.isActive
      )
      plan.defaultPricingId = defaultPricing?.id ?? null
    }
  }

  return Array.from(planMap.values())
}

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
        defaultPricingId: plans.defaultPricingId,
      },
      pricing: {
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        price: planPricing.price,
        isActive: planPricing.isActive,
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
        defaultPricingId: plans.defaultPricingId,
      },
      pricing: {
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        price: planPricing.price,
        isActive: planPricing.isActive,
      },
    })
    .from(plans)
    .leftJoin(planPricing, eq(planPricing.planId, plans.id))
    .orderBy(asc(plans.id), asc(planPricing.durationDays), asc(planPricing.id))

  return mapPlanRows(rows)
}
