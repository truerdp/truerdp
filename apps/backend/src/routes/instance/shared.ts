import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../../db.js"
import { instances, resources, servers } from "../../schema.js"

export const renewInstanceSchema = z.object({
  planPricingId: z.number().int().positive().optional(),
})

type InstanceRow = {
  id: number
  userId: number
  status: typeof instances.$inferSelect.status
  startDate: Date | null
  expiryDate: Date | null
  ipAddress: string | null
  username: string | null
}

export function getEffectiveInstanceStatus(input: {
  status: typeof instances.$inferSelect.status
  expiryDate: Date | null
}) {
  if (
    input.status === "active" &&
    input.expiryDate != null &&
    input.expiryDate < new Date()
  ) {
    return "expired" as const
  }

  return input.status
}

function instanceSummarySelect() {
  return {
    id: instances.id,
    userId: instances.userId,
    status: instances.status,
    startDate: instances.startDate,
    expiryDate: instances.expiryDate,
    ipAddress: servers.ipAddress,
    username: resources.username,
  }
}

export function formatInstanceSummary(instance: InstanceRow) {
  return {
    id: instance.id,
    status: getEffectiveInstanceStatus(instance),
    ipAddress: instance.ipAddress,
    username: instance.username,
    startDate: instance.startDate,
    expiryDate: instance.expiryDate,
  }
}

export async function listUserInstanceSummaries(userId: number) {
  return db
    .select(instanceSummarySelect())
    .from(instances)
    .leftJoin(resources, eq(resources.instanceId, instances.id))
    .leftJoin(servers, eq(resources.serverId, servers.id))
    .where(eq(instances.userId, userId))
}

export async function getInstanceSummaryById(instanceId: number) {
  const result = await db
    .select(instanceSummarySelect())
    .from(instances)
    .leftJoin(resources, eq(resources.instanceId, instances.id))
    .leftJoin(servers, eq(resources.serverId, servers.id))
    .where(eq(instances.id, instanceId))
    .limit(1)

  return result[0] ?? null
}

export async function getInstanceCredentialsById(instanceId: number) {
  const result = await db
    .select({
      id: instances.id,
      userId: instances.userId,
      status: instances.status,
      expiryDate: instances.expiryDate,
      ipAddress: servers.ipAddress,
      username: resources.username,
      passwordEncrypted: resources.passwordEncrypted,
    })
    .from(instances)
    .leftJoin(resources, eq(resources.instanceId, instances.id))
    .leftJoin(servers, eq(resources.serverId, servers.id))
    .where(eq(instances.id, instanceId))
    .limit(1)

  return result[0] ?? null
}

export async function getUserOwnedInstance(instanceId: number, userId: number) {
  const result = await db
    .select()
    .from(instances)
    .where(and(eq(instances.id, instanceId), eq(instances.userId, userId)))
    .limit(1)

  return result[0] ?? null
}

