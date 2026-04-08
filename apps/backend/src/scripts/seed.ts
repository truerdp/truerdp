import "dotenv/config"
import bcrypt from "bcrypt"
import { eq } from "drizzle-orm"
import { closeDbConnection, db } from "../db.js"
import { plans, users } from "../schema.js"

const DEFAULT_PASSWORD = "password123"
const DEFAULT_PLAN_NAME = "Starter RDP"

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
        price: 500,
        durationDays: 7,
        isActive: true,
      })
      .where(eq(plans.id, existingPlan[0].id))
      .returning({
        id: plans.id,
        name: plans.name,
      })

    return plan
  }

  const [plan] = await db
    .insert(plans)
    .values({
      name: DEFAULT_PLAN_NAME,
      cpu: 2,
      ram: 4,
      storage: 80,
      price: 500,
      durationDays: 7,
      isActive: true,
    })
    .returning({
      id: plans.id,
      name: plans.name,
    })

  return plan
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

  console.log("Seed complete")
  console.log({
    adminUser,
    normalUser,
    plan,
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
