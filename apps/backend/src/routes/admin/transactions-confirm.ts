import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  BillingError,
  confirmPendingTransaction,
} from "../../services/billing.js"
import { optionalReasonSchema } from "./shared.js"

export async function registerAdminTransactionsConfirmRoutes(server: FastifyInstance) {
server.post(
  "/admin/transactions/:id/confirm",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const transactionId = Number((request.params as Record<string, unknown>).id)
      const body = optionalReasonSchema.parse(request.body ?? {})

      if (!requireAdmin(request.user, reply)) {
        return
      }

      if (Number.isNaN(transactionId)) {
        return reply.status(400).send({ error: "Invalid transaction id" })
      }

      return await confirmPendingTransaction(transactionId, {
        adminUserId: request.user!.userId,
        reason: body.reason,
        source: "admin",
      })
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
