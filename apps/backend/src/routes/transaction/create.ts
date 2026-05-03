import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  BillingError,
  createBillingTransaction,
} from "../../services/billing.js"
import { getErrorMessage } from "../../utils/error.js"
import { createTransactionSchema as createTransactionZod } from "./shared.js"
import { createTransactionSchema } from "../../schemas/transaction.schemas.js"

export async function registerTransactionCreateRoutes(server: FastifyInstance) {
  server.post(
    "/transactions",
    { preHandler: verifyAuth, schema: createTransactionSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = createTransactionZod.parse(request.body)
        const userId = request.user!.userId

        const transaction = await createBillingTransaction({
          userId,
          orderId: body.orderId,
          method: body.method,
          ipAddress: request.ip,
        })

        return reply.status(201).send(transaction)
      } catch (err: unknown) {
        server.log.error(err)

        if (err instanceof BillingError) {
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )
}
