import "dotenv/config"
import bcrypt from "bcrypt"
import { and, eq, notInArray } from "drizzle-orm"
import { closeDbConnection, db } from "../db.js"
import { planPricing, plans, users } from "../schema.js"

const DEFAULT_PASSWORD = "password123"
const DEFAULT_PLAN_NAME = "Starter RDP"
const DEFAULT_PLAN_PRICING = [
  {
    durationDays: 30,
    price: 500,
  },
  {
    durationDays: 90,
    price: 1299,
  },
] as const

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

async function upsertPlan() {
  const existingPlan = await db
    .select({
      id: plans.id,
    })
    .from(plans)
    .where(eq(plans.name, DEFAULT_PLAN_NAME))
    .limit(1)

  if (existingPlan[0]) {
    const [plan] = await db
      .update(plans)
      .set({
        cpu: 2,
        ram: 4,
        storage: 80,
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
      name: DEFAULT_PLAN_NAME,
      cpu: 2,
      ram: 4,
      storage: 80,
      isActive: true,
    })
    .returning({
      id: plans.id,
      name: plans.name,
    })

  return requireSeedRecord(plan, "plan")
}

async function upsertPlanPricing(planId: number) {
  const pricingOptions = []

  for (const option of DEFAULT_PLAN_PRICING) {
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
          price: option.price,
          isActive: true,
        })
        .where(eq(planPricing.id, existingPricing[0].id))
        .returning({
          id: planPricing.id,
          durationDays: planPricing.durationDays,
          price: planPricing.price,
        })

      pricingOptions.push(requireSeedRecord(pricing, "plan pricing"))
      continue
    }

    const [pricing] = await db
      .insert(planPricing)
      .values({
        planId,
        durationDays: option.durationDays,
        price: option.price,
        isActive: true,
      })
      .returning({
        id: planPricing.id,
        durationDays: planPricing.durationDays,
        price: planPricing.price,
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
          DEFAULT_PLAN_PRICING.map((option) => option.durationDays)
        )
      )
    )

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

  const plan = await upsertPlan()
  const pricingOptions = await upsertPlanPricing(plan.id)

  console.log("Seed complete")
  console.log({
    adminUser,
    normalUser,
    plan,
    pricingOptions,
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
