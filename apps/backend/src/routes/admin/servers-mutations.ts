import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { servers } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import { getErrorMessage } from "../../utils/error.js"
import { serverInputSchema, serverStatusUpdateSchema } from "./shared.js"

export async function registerAdminServersMutationRoutes(
  server: FastifyInstance
) {
  server.post(
    "/admin/servers",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = serverInputSchema.parse(request.body)

        const [createdServer] = await db
          .insert(servers)
          .values({
            provider: body.provider,
            externalId: body.externalId ?? null,
            ipAddress: body.ipAddress,
            cpu: body.cpu,
            ram: body.ram,
            storage: body.storage,
            status: body.status,
          })
          .returning({
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
          })

        if (!createdServer) {
          return reply.status(500).send({
            error: "Failed to create server",
          })
        }

        return {
          message: "Server created successfully",
          server: createdServer,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.patch(
    "/admin/servers/:id/status",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const serverId = Number((request.params as Record<string, unknown>).id)

        if (Number.isNaN(serverId)) {
          return reply.status(400).send({ error: "Invalid server id" })
        }

        const body = serverStatusUpdateSchema.parse(request.body)
        const [currentServer] = await db
          .select({
            id: servers.id,
            status: servers.status,
          })
          .from(servers)
          .where(eq(servers.id, serverId))
          .limit(1)

        if (!currentServer) {
          return reply.status(404).send({
            error: "Server not found",
          })
        }

        const [updatedServer] = await db
          .update(servers)
          .set({
            status: body.status,
          })
          .where(eq(servers.id, serverId))
          .returning({
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
          })

        if (!updatedServer) {
          return reply.status(500).send({
            error: "Failed to update server status",
          })
        }

        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "server.status_change",
          entityType: "server",
          entityId: updatedServer.id,
          reason:
            body.reason ??
            `Admin changed server status from ${currentServer.status} to ${updatedServer.status}`,
          beforeState: {
            status: currentServer.status,
          },
          afterState: {
            status: updatedServer.status,
          },
        })

        return {
          message: "Server status updated successfully",
          server: updatedServer,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )
}
