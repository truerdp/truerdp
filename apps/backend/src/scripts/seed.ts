import "dotenv/config"
import bcrypt from "bcrypt"
import { and, eq, notInArray } from "drizzle-orm"
import { closeDbConnection, db } from "../db.js"
import { planPricing, plans, servers, users } from "../schema.js"

const DEFAULT_PASSWORD = "password123"
const DEFAULT_PLAN_PRICING = [
  {
    durationDays: 30,
    priceUsdCents: 500,
  },
  {
    durationDays: 90,
    priceUsdCents: 1299,
  },
  {
    durationDays: 180,
    priceUsdCents: 2399,
  },
] as const

const DEFAULT_PLANS = [
  {
    name: "Starter RDP",
    cpu: 2,
    cpuName: "Intel Xeon E5",
    cpuThreads: 2,
    ram: 4,
    ramType: "DDR4",
    storage: 80,
    storageType: "SSD",
    bandwidth: "2TB",
    os: "Windows",
    osVersion: "Windows Server 2022",
    planType: "Dedicated",
    portSpeed: "1Gbps",
    setupFees: 0,
    planLocation: "USA",
    isFeatured: true,
    pricingOptions: DEFAULT_PLAN_PRICING,
  },
  {
    name: "Business RDP",
    cpu: 4,
    cpuName: "Intel Xeon Gold",
    cpuThreads: 4,
    ram: 8,
    ramType: "DDR4 ECC",
    storage: 160,
    storageType: "SSD",
    bandwidth: "4TB",
    os: "Windows",
    osVersion: "Windows Server 2022",
    planType: "Dedicated",
    portSpeed: "1Gbps",
    setupFees: 0,
    planLocation: "Germany",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 30,
        priceUsdCents: 899,
      },
      {
        durationDays: 90,
        priceUsdCents: 2499,
      },
      {
        durationDays: 180,
        priceUsdCents: 4599,
      },
    ],
  },
  {
    name: "Performance RDP",
    cpu: 6,
    cpuName: "AMD EPYC",
    cpuThreads: 8,
    ram: 16,
    ramType: "DDR4 ECC",
    storage: 320,
    storageType: "SSD",
    bandwidth: "6TB",
    os: "Windows",
    osVersion: "Windows Server 2022 Datacenter",
    planType: "Dedicated",
    portSpeed: "2Gbps",
    setupFees: 0,
    planLocation: "Singapore",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 30,
        priceUsdCents: 1499,
      },
      {
        durationDays: 90,
        priceUsdCents: 4099,
      },
      {
        durationDays: 365,
        priceUsdCents: 14999,
      },
    ],
  },
  {
    name: "Residential Basic",
    cpu: 2,
    cpuName: "Intel Core",
    cpuThreads: 2,
    ram: 4,
    ramType: "DDR4",
    storage: 60,
    storageType: "SSD",
    bandwidth: "1TB",
    os: "Windows",
    osVersion: "Windows 11 Pro",
    planType: "Residential",
    portSpeed: "500Mbps",
    setupFees: 0,
    planLocation: "India",
    isFeatured: false,
    pricingOptions: [
      {
        durationDays: 7,
        priceUsdCents: 299,
      },
      {
        durationDays: 30,
        priceUsdCents: 999,
      },
      {
        durationDays: 90,
        priceUsdCents: 2699,
      },
    ],
  },
  {
    name: "Residential Pro",
    cpu: 4,
    cpuName: "Intel Core i7",
    cpuThreads: 4,
    ram: 8,
    ramType: "DDR4",
    storage: 120,
    storageType: "SSD",
    bandwidth: "2TB",
    os: "Windows",
    osVersion: "Windows 11 Pro",
    planType: "Residential",
    portSpeed: "1Gbps",
    setupFees: 0,
    planLocation: "UK",
    isFeatured: true,
    pricingOptions: [
      {
        durationDays: 7,
        priceUsdCents: 499,
      },
      {
        durationDays: 30,
        priceUsdCents: 1699,
      },
      {
        durationDays: 90,
        priceUsdCents: 4599,
      },
    ],
  },
] as const

type SeedPlan = (typeof DEFAULT_PLANS)[number]

function requireSeedRecord<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Failed to upsert ${label}`)
  }

  return value
}

async function upsertUser(input: {
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user"
}) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    })
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
    })

  return user
}

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
    const existingPricing = await db
      .select({
        id: planPricing.id,
      })
      .from(planPricing)
      .where(
        and(
          eq(planPricing.planId, planId),
          eq(planPricing.durationDays, option.durationDays)
        )
      )
      .limit(1)

    if (existingPricing[0]) {
      const [pricing] = await db
        .update(planPricing)
        .set({
          priceUsdCents: option.priceUsdCents,
          isActive: true,
        })
        .where(eq(planPricing.id, existingPricing[0].id))
        .returning({
          id: planPricing.id,
          durationDays: planPricing.durationDays,
          priceUsdCents: planPricing.priceUsdCents,
        })

      pricingOptions.push(requireSeedRecord(pricing, "plan pricing"))
      continue
    }

    const [pricing] = await db
      .insert(planPricing)
      .values({
        planId,
        durationDays: option.durationDays,
        priceUsdCents: option.priceUsdCents,
        isActive: true,
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

async function upsertServer() {
  const [server] = await db
    .insert(servers)
    .values({
      provider: "manual",
      externalId: null,
      ipAddress: "10.0.0.10",
      cpu: 2,
      ram: 4,
      storage: 80,
      status: "available",
      lastAssignedAt: null,
    })
    .onConflictDoUpdate({
      target: servers.ipAddress,
      set: {
        provider: "manual",
        externalId: null,
        cpu: 2,
        ram: 4,
        storage: 80,
        status: "available",
        lastAssignedAt: null,
      },
    })
    .returning({
      id: servers.id,
      provider: servers.provider,
      ipAddress: servers.ipAddress,
      status: servers.status,
    })

  return requireSeedRecord(server, "server")
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
    password: DEFAULT_PASSWORD,
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
