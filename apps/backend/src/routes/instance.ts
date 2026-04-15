import { FastifyInstance } from "fastify"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { verifyAuth } from "../middleware/auth.js"
import { instances, resources } from "../schema.js"
import {
  BillingError,
  createBillingTransaction,
  findPendingTransactionForInstance,
  getDefaultPlanPricingForPlan,
  getPlanPricingById,
  listInstanceTransactions,
  supportedPaymentMethodSchema,
} from "../services/billing.js"
import { decryptCredential } from "../services/resource-credentials.js"

const renewInstanceSchema = z.object({
  method: supportedPaymentMethodSchema.optional(),
  planPricingId: z.number().int().positive().optional(),
})

function getEffectiveInstanceStatus(input: {
  status: typeof instances.$inferSelect.status
  expiryDate: Date | null
}) {
  if (
    input.status === "active" &&
    input.expiryDate != null &&
    input.expiryDate < new Date()
  ) {
    return "expired" as const
  }

  return input.status
}

export async function instanceRoutes(server: FastifyInstance) {
  server.get(
    "/instances",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            status: instances.status,
            startDate: instances.startDate,
            expiryDate: instances.expiryDate,
            ipAddress: resources.ipAddress,
            username: resources.username,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .where(eq(instances.userId, userId))

        return result.map((instance) => ({
          id: instance.id,
          status: getEffectiveInstanceStatus(instance),
          ipAddress: instance.ipAddress,
          username: instance.username,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
        }))
      } catch (err: any) {
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
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            status: instances.status,
            startDate: instances.startDate,
            expiryDate: instances.expiryDate,
            ipAddress: resources.ipAddress,
            username: resources.username,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        return {
          id: instance.id,
          status: getEffectiveInstanceStatus(instance),
          ipAddress: instance.ipAddress,
          username: instance.username,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
        }
      } catch (err: any) {
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
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            status: instances.status,
            expiryDate: instances.expiryDate,
            ipAddress: resources.ipAddress,
            username: resources.username,
            passwordEncrypted: resources.passwordEncrypted,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

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
      } catch (err: any) {
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
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId
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

        const pendingTransaction = await findPendingTransactionForInstance(
          userId,
          instanceId
        )

        if (pendingTransaction) {
          return reply.status(400).send({
            error: "Pending transaction already exists",
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

        const transaction = await createBillingTransaction({
          userId,
          planPricingId: selectedPricing.id,
          method: body.method ?? "upi",
          instanceId: instance.id,
        })

        return {
          message: "Renewal initiated",
          transaction,
        }
      } catch (err: any) {
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

  server.get(
    "/instances/:id/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const instanceResult = await db
          .select()
          .from(instances)
          .where(
            and(eq(instances.id, instanceId), eq(instances.userId, userId))
          )
          .limit(1)

        if (!instanceResult[0]) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        const txs = await listInstanceTransactions(userId, instanceId)

        return txs.map((tx) => ({
          id: tx.id,
          status: tx.status,
          amount: tx.amount,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
          kind: tx.kind,
          invoice: tx.invoice,
        }))
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
