import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { verifyAuth } from "../middleware/auth.js"
import { instances } from "../schema.js"
import type { GenericRouteRequest } from "../types/requests.js"
import {
  BillingError,
  createBillingOrder,
  getDefaultPlanPricingForPlan,
  getPlanPricingById,
} from "../services/billing.js"
import { decryptCredential } from "../services/resource-credentials.js"
import {
  formatInstanceSummary,
  getEffectiveInstanceStatus,
  getInstanceCredentialsById,
  getInstanceSummaryById,
  listUserInstanceSummaries,
  renewInstanceSchema,
} from "./instance/shared.js"
import { registerInstanceTransactionRoutes } from "./instance/transactions.js"

export async function instanceRoutes(server: FastifyInstance) {
  server.get(
    "/instances",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const userId = request.user!.userId

        const instancesList = await listUserInstanceSummaries(userId)
        return instancesList.map(formatInstanceSummary)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/instances/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number((request.params as Record<string, unknown>).id)
        const userId = request.user!.userId

        const instance = await getInstanceSummaryById(instanceId)

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        return formatInstanceSummary(instance)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/instances/:id/credentials",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number((request.params as Record<string, unknown>).id)
        const userId = request.user!.userId

        const instance = await getInstanceCredentialsById(instanceId)

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (getEffectiveInstanceStatus(instance) !== "active") {
          return reply.status(400).send({
            error: "Instance not active",
          })
        }

        if (
          !instance.ipAddress ||
          !instance.username ||
          !instance.passwordEncrypted
        ) {
          return reply.status(400).send({
            error: "Instance credentials are not available",
          })
        }

        return {
          ipAddress: instance.ipAddress,
          username: instance.username,
          password: decryptCredential(instance.passwordEncrypted),
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/instances/:id/renew",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number((request.params as Record<string, unknown>).id)
        const userId = request.user!.userId
        const body = renewInstanceSchema.parse(request.body ?? {})

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
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  registerInstanceTransactionRoutes(server)
}
