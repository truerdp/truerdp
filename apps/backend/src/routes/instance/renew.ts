import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { verifyAuth } from "../../middleware/auth.js"
import { instances } from "../../schema.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  BillingError,
  createBillingOrder,
  getDefaultPlanPricingForPlan,
  getPlanPricingById,
} from "../../services/billing.js"
import {
  getEffectiveInstanceStatus,
  renewInstanceSchema as renewInstanceZod,
} from "../instance/shared.js"
import { renewInstanceSchema } from "../../schemas/instance.schemas.js"

export async function registerInstanceRenewRoutes(server: FastifyInstance) {
  server.post(
    "/instances/:id/renew",
    { preHandler: verifyAuth, schema: renewInstanceSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number(
          (request.params as Record<string, unknown>).id
        )
        const userId = request.user!.userId
        const body = renewInstanceZod.parse(request.body ?? {})

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const effectiveStatus = getEffectiveInstanceStatus(instance)

        if (!["active", "expired"].includes(effectiveStatus)) {
          return reply.status(400).send({
            error: "Instance is not eligible for renewal",
          })
        }

        const selectedPricing =
          body.planPricingId != null
            ? await getPlanPricingById(body.planPricingId)
            : await getDefaultPlanPricingForPlan(instance.planId)

        if (!selectedPricing) {
          return reply.status(400).send({
            error:
              body.planPricingId != null
                ? "Invalid planPricingId"
                : "No active pricing found for the instance plan",
          })
        }

        if (selectedPricing.planId !== instance.planId) {
          return reply.status(400).send({
            error: "Renewal must use pricing from the instance plan",
          })
        }

        const order = await createBillingOrder({
          userId,
          planPricingId: selectedPricing.id,
          instanceId: instance.id,
        })

        return {
          message: "Renewal order created",
          orderId: order.orderId,
        }
      } catch (err: unknown) {
        server.log.error(err)

        if (err instanceof BillingError) {
          const statusCode: 400 | 403 | 404 | 500 =
            err.statusCode === 400 ||
            err.statusCode === 403 ||
            err.statusCode === 404
              ? err.statusCode
              : 500

          return reply.status(statusCode).send({
            error: err.message,
          })
        }

        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
