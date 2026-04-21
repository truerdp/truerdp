import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../middleware/auth.js"
import {
  BillingError,
  createBillingTransaction,
  listUserInvoices,
  listUserTransactions,
  supportedPaymentMethodSchema,
} from "../services/billing.js"

const createTransactionSchema = z.object({
  orderId: z.number().int().positive(),
  method: supportedPaymentMethodSchema,
})

export async function transactionRoutes(server: FastifyInstance) {
  server.post(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const body = createTransactionSchema.parse(request.body)
        const userId = request.user.userId

        const transaction = await createBillingTransaction({
          userId,
          orderId: body.orderId,
          method: body.method,
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

  server.get(
    "/invoices",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        return await listUserInvoices(request.user.userId)
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
