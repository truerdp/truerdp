import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import { BillingError, createBillingOrder } from "../../services/billing.js"
import { getErrorMessage } from "../../utils/error.js"
import { createOrderSchema } from "../../schemas/order.schemas.js"

const createOrderBodySchema = z.object({
  planPricingId: z.number().int().positive(),
  instanceId: z.number().int().positive().optional(),
})

export async function registerOrderCreateRoutes(server: FastifyInstance) {
  server.post(
    "/orders",
    { preHandler: verifyAuth, schema: createOrderSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = createOrderBodySchema.parse(request.body ?? {})
        const userId = request.user!.userId
        const order = await createBillingOrder({
          userId,
          planPricingId: body.planPricingId,
          instanceId: body.instanceId,
        })

        return reply.status(201).send({
          orderId: order.orderId,
        })
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
