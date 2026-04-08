import { FastifyInstance } from "fastify"
import { z } from "zod"
import { db } from "../db.js"
import { eq } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { instances } from "../schema.js"
import {
  BillingError,
  createBillingTransaction,
  findPendingTransactionForInstance,
  getDefaultPlanPricingForPlan,
  getPlanPricingById,
  listInstanceTransactions,
  supportedPaymentMethodSchema,
} from "../services/billing.js"

const renewInstanceSchema = z.object({
  method: supportedPaymentMethodSchema.optional(),
  planPricingId: z.number().int().positive().optional(),
})

export async function instanceRoutes(server: FastifyInstance) {
  // Route for users to view their provisioned instances
  server.get(
    "/instances",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.userId, userId))

        const now = new Date()

        // ⚠️ IMPORTANT: hide sensitive fields
        const safeData = result.map((i) => {
          let status = i.status

          if (i.expiryDate && i.expiryDate < now && i.status === "active") {
            status = "expired"
          }

          return {
            id: i.id,
            status,
            ipAddress: i.ipAddress,
            username: i.username,
            startDate: i.startDate,
            expiryDate: i.expiryDate,
          }
        })

        return safeData
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Route for users to view details of a specific instance
  server.get(
    "/instances/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        // ✅ Ownership check
        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        return {
          id: instance.id,
          status: instance.status,
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

  // Route for users to get credentials of a specific instance
  server.post(
    "/instances/:id/credentials",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        // ✅ Ownership check
        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        // ⚠️ Optional: only allow if active
        if (instance.status !== "active") {
          return reply.status(400).send({
            error: "Instance not active",
          })
        }

        return {
          ipAddress: instance.ipAddress,
          username: instance.username,
          password: instance.password,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  //✅ Route for users to renew an instance (creates a new transaction)
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

        const isExpired =
          instance.status === "expired" ||
          (instance.expiryDate != null && instance.expiryDate < new Date())

        if (!["active", "expired"].includes(instance.status) && !isExpired) {
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

  // ✅ Route for users to view transactions of a specific instance
  server.get(
    "/instances/:id/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        // ✅ Get instance
        const instanceResult = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = instanceResult[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        // ✅ Ownership check
        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
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
