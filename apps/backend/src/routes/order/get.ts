import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import { BillingError, getBillingOrderForUser } from "../../services/billing.js"
import { getErrorMessage } from "../../utils/error.js"
import { getOrderSchema } from "../../schemas/order.schemas.js"

const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export async function registerOrderGetRoutes(server: FastifyInstance) {
  server.get(
    "/orders/:id",
    { preHandler: verifyAuth, schema: getOrderSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = orderIdParamsSchema.parse(request.params)
        const userId = request.user!.userId
        return await getBillingOrderForUser(userId, params.id)
      } catch (err: unknown) {
        request.log.error(err)

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
