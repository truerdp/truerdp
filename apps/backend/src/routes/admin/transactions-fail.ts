import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  BillingError,
  failPendingTransactionByAdmin,
} from "../../services/billing.js"
import { reasonSchema } from "./shared.js"

export async function registerAdminTransactionsFailRoutes(server: FastifyInstance) {
  server.post(
    "/admin/transactions/:id/fail",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const transactionId = Number(
          (request.params as Record<string, unknown>).id
        )
        const body = reasonSchema.parse(request.body ?? {})

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(transactionId)) {
          return reply.status(400).send({ error: "Invalid transaction id" })
        }

        const result = await failPendingTransactionByAdmin({
          transactionId,
          adminUserId: request.user!.userId,
          reason: body.reason,
        })

        return {
          message: result.changed
            ? "Transaction marked as failed"
            : "Transaction already failed",
          transaction: result.transaction,
          invoice: result.invoice,
          order: result.order,
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
}
