import { FastifyInstance } from "fastify"
import { and, asc, eq, gte, lt, ne } from "drizzle-orm"
import { db } from "../../db.js"
import { instances } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"

export async function registerAdminInstanceExpiryRoutes(server: FastifyInstance) {
  server.get(
    "/admin/instances/expired",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            planId: instances.planId,
            expiryDate: instances.expiryDate,
            status: instances.status,
            createdAt: instances.createdAt,
          })
          .from(instances)
          .where(
            and(
              ne(instances.status, "terminated"),
              ne(instances.status, "suspended"),
              lt(instances.expiryDate, today)
            )
          )
          .orderBy(asc(instances.expiryDate))

        return result.map((instance) => {
          const expiryDate = instance.expiryDate
            ? new Date(instance.expiryDate)
            : today
          expiryDate.setHours(0, 0, 0, 0)

          const daysSinceExpiry = Math.max(
            0,
            Math.floor(
              (today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          return {
            ...instance,
            status: "expired" as const,
            daysSinceExpiry,
          }
        })
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/instances/expiring-soon",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const threeDaysFromToday = new Date(today)
        threeDaysFromToday.setDate(today.getDate() + 3)

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            planId: instances.planId,
            expiryDate: instances.expiryDate,
            status: instances.status,
            createdAt: instances.createdAt,
          })
          .from(instances)
          .where(
            and(
              eq(instances.status, "active"),
              gte(instances.expiryDate, today),
              lt(instances.expiryDate, threeDaysFromToday)
            )
          )
          .orderBy(asc(instances.expiryDate))

        return result.map((instance) => {
          const expiryDate = instance.expiryDate
            ? new Date(instance.expiryDate)
            : today
          expiryDate.setHours(0, 0, 0, 0)

          const daysUntilExpiry = Math.max(
            0,
            Math.floor(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          return {
            ...instance,
            daysUntilExpiry,
          }
        })
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
