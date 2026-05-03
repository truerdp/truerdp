import "dotenv/config"
import { and, eq, notInArray } from "drizzle-orm"
import { closeDbConnection, db } from "../db.js"
import { planPricing, plans } from "../schema.js"
import { DEFAULT_PLANS, type SeedPlan } from "./seed-data.js"
import { requireSeedRecord, upsertServer, upsertUser } from "./seed-core.js"

async function upsertPlan(input: SeedPlan) {
  const existingPlan = await db
    .select({
      id: plans.id,
    })
    .from(plans)
    .where(eq(plans.name, input.name))
    .limit(1)

  if (existingPlan[0]) {
    const [plan] = await db
      .update(plans)
      .set({
        cpu: input.cpu,
        cpuName: input.cpuName,
        cpuThreads: input.cpuThreads,
        ram: input.ram,
        ramType: input.ramType,
        storage: input.storage,
        storageType: input.storageType,
        bandwidth: input.bandwidth,
        os: input.os,
        osVersion: input.osVersion,
        planType: input.planType,
        portSpeed: input.portSpeed,
        setupFees: input.setupFees,
        planLocation: input.planLocation,
        isFeatured: input.isFeatured,
        isActive: true,
      })
      .where(eq(plans.id, existingPlan[0].id))
      .returning({
        id: plans.id,
        name: plans.name,
      })

    return requireSeedRecord(plan, "plan")
  }

  const [plan] = await db
    .insert(plans)
    .values({
      name: input.name,
      cpu: input.cpu,
      cpuName: input.cpuName,
      cpuThreads: input.cpuThreads,
      ram: input.ram,
      ramType: input.ramType,
      storage: input.storage,
      storageType: input.storageType,
      bandwidth: input.bandwidth,
      os: input.os,
      osVersion: input.osVersion,
      planType: input.planType,
      portSpeed: input.portSpeed,
      setupFees: input.setupFees,
      planLocation: input.planLocation,
      isFeatured: input.isFeatured,
      isActive: true,
    })
    .returning({
      id: plans.id,
      name: plans.name,
    })

  return requireSeedRecord(plan, "plan")
}

async function upsertPlanPricing(
  planId: number,
  pricingCatalog: SeedPlan["pricingOptions"]
) {
  const pricingOptions = []

  for (const option of pricingCatalog) {
    const [pricing] = await db
      .insert(planPricing)
      .values({
        planId,
        durationDays: option.durationDays,
        priceUsdCents: option.priceUsdCents,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [planPricing.planId, planPricing.durationDays],
        set: {
          priceUsdCents: option.priceUsdCents,
          isActive: true,
        },
      })
      .returning({
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        priceUsdCents: planPricing.priceUsdCents,
      })

    pricingOptions.push(requireSeedRecord(pricing, "plan pricing"))
  }

  await db
    .update(planPricing)
    .set({
      isActive: false,
    })
    .where(
      and(
        eq(planPricing.planId, planId),
        notInArray(
          planPricing.durationDays,
          pricingCatalog.map((option) => option.durationDays)
        )
      )
    )

  const defaultPricing = pricingOptions.find(
    (option) => option.durationDays === 30
  )

  await db
    .update(plans)
    .set({
      defaultPricingId: defaultPricing?.id ?? pricingOptions[0]?.id ?? null,
    })
    .where(eq(plans.id, planId))

  return pricingOptions
}

async function seed() {
  const adminUser = await upsertUser({
    email: "admin@truerdp.local",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
  })

  const normalUser = await upsertUser({
    email: "user@truerdp.local",
    firstName: "Test",
    lastName: "User",
    role: "user",
  })

  const seededPlans = []

  for (const planInput of DEFAULT_PLANS) {
    const plan = await upsertPlan(planInput)
    const pricingOptions = await upsertPlanPricing(
      plan.id,
      planInput.pricingOptions
    )

    seededPlans.push({
      ...plan,
      pricingOptions,
    })
  }

  const server = await upsertServer()

  console.log("Seed complete")
  console.log({
    adminUser,
    normalUser,
    plans: seededPlans,
    server,
  })
}

seed()
  .catch((error) => {
    console.error("Seed failed")
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await closeDbConnection()
  })
