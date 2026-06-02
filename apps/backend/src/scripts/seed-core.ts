import { hashPassword } from "better-auth/crypto"
import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { account, servers, users } from "../schema.js"

function requireSeedRecord<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Failed to upsert ${label}`)
  }

  return value
}

export async function upsertUser(input: {
  email: string
  firstName: string
  lastName: string
  role: "admin" | "user"
}) {
  const name = `${input.firstName} ${input.lastName}`

  const [user] = await db
    .insert(users)
    .values({
      name,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
      },
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })

  return requireSeedRecord(user, "user")
}

// Create a loginable Better Auth credential account for a seeded user.
// This mirrors Better Auth's sign-up logic but keeps the user immediately usable
// in dev by marking the email as verified.
export async function ensureAuthAccount(input: {
  userId: number
  email: string
  firstName: string
  lastName: string
}) {
  const hashedPassword = await hashPassword("password123")
  const name = `${input.firstName} ${input.lastName}`

  await db
    .insert(account)
    .values({
      userId: input.userId,
      accountId: String(input.userId),
      providerId: "credential",
      password: hashedPassword,
    })
    .onConflictDoUpdate({
      target: [account.providerId, account.accountId],
      set: {
        userId: input.userId,
        password: hashedPassword,
      },
    })

  await db
    .update(users)
    .set({
      name,
      emailVerified: true,
    })
    .where(eq(users.email, input.email))

  console.log(`seed: created auth account for ${input.email}`)
}

export async function upsertServer() {
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

export { requireSeedRecord }
