import { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "../db.js"
import { instances } from "../schema.js"
import { verifyAuth } from "../middleware/auth.js"
import {
  BillingError,
  createBillingTransaction,
  findPendingTransactionForInstance,
  listUserTransactions,
  supportedPaymentMethodSchema,
} from "../services/billing.js"

const createTransactionSchema = z.object({
  planId: z.number().int().positive(),
  method: supportedPaymentMethodSchema,
  instanceId: z.number().int().positive().optional(),
})

export async function transactionRoutes(server: FastifyInstance) {
  server.post(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const body = createTransactionSchema.parse(request.body)
        const userId = request.user.userId

        if (body.instanceId) {
          const instanceResult = await db
            .select()
            .from(instances)
            .where(eq(instances.id, body.instanceId))
            .limit(1)

          const instance = instanceResult[0]

          if (!instance) {
            return reply.status(400).send({ error: "Invalid instanceId" })
          }

          if (instance.userId !== userId) {
            return reply.status(403).send({ error: "Forbidden" })
          }

          if (instance.planId !== body.planId) {
            return reply.status(400).send({
              error: "Renewal must use the instance plan",
            })
          }

          const isExpired =
            instance.expiryDate != null && instance.expiryDate < new Date()

          if (
            !["active", "expired"].includes(instance.status) &&
            !isExpired
          ) {
            return reply.status(400).send({
              error: "Instance is not eligible for renewal",
            })
          }

          const pendingTransaction = await findPendingTransactionForInstance(
            userId,
            body.instanceId
          )

          if (pendingTransaction) {
            return reply.status(400).send({
              error: "Pending transaction already exists",
            })
          }
        }

        const transaction = await createBillingTransaction({
          userId,
          planId: body.planId,
          method: body.method,
          instanceId: body.instanceId,
        })

        return reply.status(201).send(transaction)
      } catch (err: any) {
        server.log.error(err)

        if (err instanceof BillingError) {
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.get(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        return await listUserTransactions(request.user.userId)
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
