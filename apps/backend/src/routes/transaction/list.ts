import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  getUserTransactionById,
  listUserTransactions,
  listUserInvoices,
} from "../../services/billing.js"
import {
  getTransactionCheckoutStatusSchema,
  listTransactionsSchema,
  listInvoicesSchema,
} from "../../schemas/transaction.schemas.js"
import { transactionParamsSchema } from "./shared.js"

export async function registerTransactionListRoutes(server: FastifyInstance) {
  server.get(
    "/transactions",
    { preHandler: verifyAuth, schema: listTransactionsSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        return await listUserTransactions(request.user!.userId)
      } catch (err: unknown) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/transactions/:transactionId/checkout-status",
    { preHandler: verifyAuth, schema: getTransactionCheckoutStatusSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const { transactionId } = transactionParamsSchema.parse(request.params)
        const transaction = await getUserTransactionById(
          request.user!.userId,
          transactionId
        )

        if (!transaction) {
          return reply.status(404).send({
            error: "Transaction not found",
          })
        }

        return transaction
      } catch (err: unknown) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/invoices",
    { preHandler: verifyAuth, schema: listInvoicesSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        return await listUserInvoices(request.user!.userId)
      } catch (err: unknown) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
