import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { plans } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  updatePlanFeaturedSchema,
  updatePlanStatusSchema,
} from "./shared.js"

export async function registerAdminPlansFlagsRoutes(server: FastifyInstance) {
server.patch(
  "/admin/plans/:id/status",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const planId = Number((request.params as Record<string, unknown>).id)

      if (Number.isNaN(planId)) {
        return reply.status(400).send({ error: "Invalid plan id" })
      }

      const body = updatePlanStatusSchema.parse(request.body)

      const [updated] = await db
        .update(plans)
        .set({
          isActive: body.isActive,
        })
        .where(eq(plans.id, planId))
        .returning({
          id: plans.id,
        })

      if (!updated) {
        return reply.status(404).send({
          error: "Plan not found",
        })
      }

      return reply.send({
        message: body.isActive
          ? "Plan activated successfully"
          : "Plan deactivated successfully",
      })
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

server.patch(
  "/admin/plans/:id/featured",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const planId = Number((request.params as Record<string, unknown>).id)

      if (Number.isNaN(planId)) {
        return reply.status(400).send({ error: "Invalid plan id" })
      }

      const body = updatePlanFeaturedSchema.parse(request.body)

      const [updated] = await db
        .update(plans)
        .set({
          isFeatured: body.isFeatured,
        })
        .where(eq(plans.id, planId))
        .returning({
          id: plans.id,
        })

      if (!updated) {
        return reply.status(404).send({
          error: "Plan not found",
        })
      }

      return reply.send({
        message: body.isFeatured
          ? "Plan added to featured plans"
          : "Plan removed from featured plans",
      })
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)
}
