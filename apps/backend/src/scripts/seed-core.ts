import bcrypt from "bcrypt"
import { db } from "../db.js"
import { servers, users } from "../schema.js"
import { DEFAULT_PASSWORD } from "./seed-data.js"

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

