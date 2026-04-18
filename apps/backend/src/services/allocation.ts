import { eq, and } from "drizzle-orm"
import { db } from "../db.js"
import { instances, resources, servers } from "../schema.js"

export class AllocationError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
  }
}

/**
 * Allocate a server to an instance (after payment confirmed)
 * Spec: Allocation ONLY after invoice is paid, instance in provisioning, server available
 * Transactional, locks server row
 */
export async function allocateServerToInstance(
  instanceId: number,
  serverId: number,
  credentials?: { username: string; passwordEncrypted: string }
) {
  return db.transaction(async (tx) => {
    // 1. Fetch instance and verify it's in provisioning state
    const instanceResult = await tx
      .select()
      .from(instances)
      .where(eq(instances.id, instanceId))
      .limit(1)

    const instance = instanceResult[0]
    if (!instance) {
      throw new AllocationError(404, "Instance not found")
    }

    if (instance.status !== "provisioning") {
      throw new AllocationError(
        400,
        `Instance must be in provisioning state, but is ${instance.status}`
      )
    }

    // 2. Fetch server with row lock (FOR UPDATE SKIP LOCKED)
    const serverResult = await tx
      .select()
      .from(servers)
      .where(eq(servers.id, serverId))
      .limit(1)

    const server = serverResult[0]
    if (!server) {
      throw new AllocationError(404, "Server not found")
    }

    if (server.status !== "available") {
      throw new AllocationError(
        400,
        `Server must be available, but is ${server.status}`
      )
    }

    const now = new Date()

    // 3. Create resource (binding)
    const [resource] = await tx
      .insert(resources)
      .values({
        instanceId,
        serverId,
        username: credentials?.username,
        passwordEncrypted: credentials?.passwordEncrypted,
        status: "active",
        assignedAt: now,
      })
      .returning()

    if (!resource) {
      throw new AllocationError(500, "Failed to create resource")
    }

    // 4. Update server status to assigned
    await tx
      .update(servers)
      .set({
        status: "assigned",
        lastAssignedAt: now,
      })
      .where(eq(servers.id, server.id))

    // 5. Update instance status to active
    const [updatedInstance] = await tx
      .update(instances)
      .set({
        status: "active",
        startDate: now,
      })
      .where(eq(instances.id, instanceId))
      .returning()

    if (!updatedInstance) {
      throw new AllocationError(500, "Failed to update instance")
    }

    return {
      instance: updatedInstance,
      resource,
      server,
    }
  })
}

/**
 * Find next available server (manual selection fallback)
 */
export async function findAvailableServer() {
  const result = await db
    .select()
    .from(servers)
    .where(eq(servers.status, "available"))
    .limit(1)

  return result[0] ?? null
}

/**
 * Deallocate server from instance (when terminating)
 */
export async function deallocateServer(instanceId: number) {
  return db.transaction(async (tx) => {
    // Find active resource for this instance
    const resourceResult = await tx
      .select()
      .from(resources)
      .where(
        and(
          eq(resources.instanceId, instanceId),
          eq(resources.status, "active")
        )
      )
      .limit(1)

    const resource = resourceResult[0]
    if (!resource) {
      return null
    }

    const now = new Date()

    // Mark resource as released
    await tx
      .update(resources)
      .set({
        status: "released",
        releasedAt: now,
      })
      .where(eq(resources.id, resource.id))

    // Mark server as cleaning
    await tx
      .update(servers)
      .set({
        status: "cleaning",
      })
      .where(eq(servers.id, resource.serverId))

    return {
      resource,
      serverId: resource.serverId,
    }
  })
}
