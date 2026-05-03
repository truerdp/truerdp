import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  BillingError,
  applyCouponToBillingOrder,
  removeCouponFromBillingOrder,
} from "../../services/billing.js"
import { getErrorMessage } from "../../utils/error.js"
import { couponSchema } from "../../schemas/order.schemas.js"

const couponBodySchema = z.object({
  code: z.string().trim().min(1).optional().nullable(),
})

const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export async function registerOrderCouponRoutes(server: FastifyInstance) {
  server.patch(
    "/orders/:id/coupon",
    { preHandler: verifyAuth, schema: couponSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = orderIdParamsSchema.parse(request.params)
        const body = couponBodySchema.parse(request.body ?? {})
        const userId = request.user!.userId

        const updated =
          body.code && body.code.trim()
            ? await applyCouponToBillingOrder({
                userId,
                orderId: params.id,
                code: body.code,
              })
            : await removeCouponFromBillingOrder({
                userId,
                orderId: params.id,
              })

        return reply.send({
          message:
            body.code && body.code.trim() ? "Coupon applied" : "Coupon removed",
          order: updated,
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
