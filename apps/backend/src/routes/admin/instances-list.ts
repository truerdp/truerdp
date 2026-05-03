import { FastifyInstance } from "fastify"
import { desc, eq, sql } from "drizzle-orm"
import { db } from "../../db.js"
import {
  instanceExtensions,
  instances,
  resources,
  servers,
} from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { adminQuerySchemas } from "./shared.js"

const { adminListPaginationQuerySchema } = adminQuerySchemas

export async function registerAdminInstancesListRoutes(server: FastifyInstance) {
  server.get(
    "/admin/instances",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminListPaginationQuerySchema.parse(request.query ?? {})

        const countResult = await db
          .select({ totalCount: sql<number>`count(*)::int` })
          .from(instances)

        const totalCount = countResult[0]?.totalCount ?? 0
        const totalPages = Math.ceil(totalCount / query.pageSize)
        const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1
        const offset = (page - 1) * query.pageSize

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            status: instances.status,
            startDate: instances.startDate,
            expiryDate: instances.expiryDate,
            ipAddress: servers.ipAddress,
            provider: servers.provider,
            resourceStatus: resources.status,
            extensionCount: sql<number>`(
            select count(*)::int
            from ${instanceExtensions} ie
            where ie.instance_id = ${instances.id}
          )`,
            lastExtensionAt: sql<string | null>`(
            select ie.created_at::text
            from ${instanceExtensions} ie
            where ie.instance_id = ${instances.id}
            order by ie.created_at desc
            limit 1
          )`,
            lastExtensionDays: sql<number | null>`(
            select ie.days_extended
            from ${instanceExtensions} ie
            where ie.instance_id = ${instances.id}
            order by ie.created_at desc
            limit 1
          )`,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .leftJoin(servers, eq(resources.serverId, servers.id))
          .orderBy(desc(instances.createdAt))
          .limit(query.pageSize)
          .offset(offset)

        return {
          items: result,
          pagination: {
            page,
            pageSize: query.pageSize,
            totalCount,
            totalPages,
          },
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
