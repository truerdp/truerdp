import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { planPricing, plans } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { updatePlanFeaturedSchema, updatePlanStatusSchema } from "./shared.js"
import { syncPlanPricingToDodo } from "./dodo-sync.js"

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

  server.post(
    "/admin/plans/:id/sync-dodo",
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

        const pricingRows = await db
          .select({
            id: planPricing.id,
            planName: plans.name,
            durationDays: planPricing.durationDays,
            priceUsdCents: planPricing.priceUsdCents,
            promoPriceUsdCents: planPricing.promoPriceUsdCents,
            dodoProductId: planPricing.dodoProductId,
          })
          .from(planPricing)
          .innerJoin(plans, eq(planPricing.planId, plans.id))
          .where(eq(planPricing.planId, planId))

        if (pricingRows.length === 0) {
          return reply.status(404).send({ error: "Plan not found" })
        }

        await db
          .update(planPricing)
          .set({
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(planPricing.planId, planId))

        const syncResults = await Promise.all(
          pricingRows.map((pricing) => syncPlanPricingToDodo(pricing))
        )
        const failedSyncCount = syncResults.filter(
          (result) => result.status === "failed"
        ).length

        return {
          message:
            failedSyncCount > 0
              ? "Dodo product sync completed with failures"
              : "Dodo product sync completed",
          dodoSync: {
            failed: failedSyncCount,
            total: syncResults.length,
          },
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
