import { FastifyInstance } from "fastify"
import { and, asc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { instances, resources, servers } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"

export async function registerAdminServersListRoutes(server: FastifyInstance) {
  server.get(
    "/admin/servers",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const result = await db
          .select({
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
            activeResourceId: resources.id,
            activeInstanceId: instances.id,
            activeResourceUsername: resources.username,
          })
          .from(servers)
          .leftJoin(
            resources,
            and(eq(resources.serverId, servers.id), eq(resources.status, "active"))
          )
          .leftJoin(instances, eq(resources.instanceId, instances.id))
          .orderBy(asc(servers.id))

        return result
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/servers/available",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const availableServers = await db
          .select()
          .from(servers)
          .where(eq(servers.status, "available"))

        return availableServers
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
