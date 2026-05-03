import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  BillingError,
  failPendingTransactionForUser,
} from "../../services/billing.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  hostedReturnSchema as hostedReturnZod,
  transactionParamsSchema,
} from "./shared.js"
import { hostedReturnSchema } from "../../schemas/transaction.schemas.js"

export async function registerTransactionHostedReturnRoutes(
  server: FastifyInstance
) {
  server.post(
    "/transactions/:transactionId/hosted-return",
    { preHandler: verifyAuth, schema: hostedReturnSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const { transactionId } = transactionParamsSchema.parse(request.params)
        const body = hostedReturnZod.parse(request.body ?? {})

        if (
          !["failed", "failure", "cancelled", "canceled"].includes(body.status)
        ) {
          return reply.status(400).send({
            error: "Only failed hosted checkout returns can be reconciled here",
          })
        }

        const reason = body.paymentId
          ? `Hosted checkout returned ${body.status} for payment ${body.paymentId}`
          : `Hosted checkout returned ${body.status}`

        const result = await failPendingTransactionForUser({
          userId: request.user!.userId,
          transactionId,
          reason,
          source: "provider_return",
        })

        return {
          message: result.changed
            ? "Transaction marked as failed"
            : "Transaction was already failed",
          transactionId: result.transaction.id,
          status: result.transaction.status,
        }
      } catch (err: unknown) {
        request.log.error(err)

        if (err instanceof BillingError) {
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

        return reply.status(400).send({
          error: getErrorMessage(
            err,
            "Unable to reconcile hosted checkout return"
          ),
        })
      }
    }
  )
}
