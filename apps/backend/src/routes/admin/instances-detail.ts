import { FastifyInstance } from "fastify"
import { desc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import {
  instanceExtensions,
  instanceStatusEvents,
  instances,
  plans,
  resources,
  servers,
  users,
} from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"

export async function registerAdminInstanceDetailRoutes(server: FastifyInstance) {
  server.get(
    "/admin/instances/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number((request.params as Record<string, unknown>).id)

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(instanceId)) {
          return reply.status(400).send({ error: "Invalid instance id" })
        }

        const result = await db
          .select({
            instance: {
              id: instances.id,
              userId: instances.userId,
              planId: instances.planId,
              status: instances.status,
              startDate: instances.startDate,
              expiryDate: instances.expiryDate,
              terminatedAt: instances.terminatedAt,
              provisionAttempts: instances.provisionAttempts,
              lastProvisionError: instances.lastProvisionError,
              createdAt: instances.createdAt,
              updatedAt: instances.updatedAt,
            },
            plan: {
              id: plans.id,
              name: plans.name,
              cpu: plans.cpu,
              ram: plans.ram,
              storage: plans.storage,
            },
            user: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
            resource: {
              id: resources.id,
              username: resources.username,
              status: resources.status,
              assignedAt: resources.assignedAt,
              releasedAt: resources.releasedAt,
              createdAt: resources.createdAt,
              updatedAt: resources.updatedAt,
            },
            server: {
              id: servers.id,
              provider: servers.provider,
              externalId: servers.externalId,
              ipAddress: servers.ipAddress,
              cpu: servers.cpu,
              ram: servers.ram,
              storage: servers.storage,
              status: servers.status,
              lastAssignedAt: servers.lastAssignedAt,
              createdAt: servers.createdAt,
              updatedAt: servers.updatedAt,
            },
          })
          .from(instances)
          .leftJoin(plans, eq(instances.planId, plans.id))
          .leftJoin(users, eq(instances.userId, users.id))
          .leftJoin(resources, eq(instances.id, resources.instanceId))
          .leftJoin(servers, eq(resources.serverId, servers.id))
          .where(eq(instances.id, instanceId))
          .limit(1)

        if (!result[0]) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        const extensionHistory = await db
          .select({
            id: instanceExtensions.id,
            previousExpiryDate: instanceExtensions.previousExpiryDate,
            newExpiryDate: instanceExtensions.newExpiryDate,
            daysExtended: instanceExtensions.daysExtended,
            createdAt: instanceExtensions.createdAt,
            extendedBy: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(instanceExtensions)
          .leftJoin(users, eq(instanceExtensions.extendedByUserId, users.id))
          .where(eq(instanceExtensions.instanceId, instanceId))
          .orderBy(desc(instanceExtensions.createdAt))

        const statusEvents = await db
          .select({
            id: instanceStatusEvents.id,
            action: instanceStatusEvents.action,
            reason: instanceStatusEvents.reason,
            fromStatus: instanceStatusEvents.fromStatus,
            toStatus: instanceStatusEvents.toStatus,
            createdAt: instanceStatusEvents.createdAt,
            admin: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(instanceStatusEvents)
          .leftJoin(users, eq(instanceStatusEvents.adminUserId, users.id))
          .where(eq(instanceStatusEvents.instanceId, instanceId))
          .orderBy(desc(instanceStatusEvents.createdAt))

        return {
          ...result[0],
          extensionHistory,
          statusEvents,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
