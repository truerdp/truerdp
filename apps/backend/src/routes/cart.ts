import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../middleware/auth.js"
import {
  addCartItem,
  clearCartForUser,
  getCartForUser,
  removeCartItem,
  updateCartItemQuantity,
} from "../services/cart.js"
import { checkoutCartForUser } from "../services/cart-checkout.js"
import { BillingError } from "../services/billing.js"
import type { GenericRouteRequest, RouteReply } from "../types/requests.js"
import { getErrorMessage } from "../utils/error.js"

const addCartItemBodySchema = z.object({
  planPricingId: z.number().int().positive(),
  quantity: z.number().int().positive().max(99).optional(),
})

const updateCartItemBodySchema = z.object({
  quantity: z.number().int().positive().max(99),
})

const cartItemParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

function sendCartError(reply: RouteReply, err: unknown) {
  if (err instanceof BillingError) {
    return reply.status(err.statusCode).send({ error: err.message })
  }

  return reply.status(400).send({ error: getErrorMessage(err) })
}

export async function cartRoutes(server: FastifyInstance) {
  server.get(
    "/cart",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        return await getCartForUser(request.user!.userId)
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )

  server.post(
    "/cart/items",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = addCartItemBodySchema.parse(request.body ?? {})
        const cart = await addCartItem({
          userId: request.user!.userId,
          planPricingId: body.planPricingId,
          quantity: body.quantity,
        })

        return reply.status(201).send(cart)
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )

  server.patch(
    "/cart/items/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = cartItemParamsSchema.parse(request.params)
        const body = updateCartItemBodySchema.parse(request.body ?? {})

        return await updateCartItemQuantity({
          userId: request.user!.userId,
          cartItemId: params.id,
          quantity: body.quantity,
        })
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )

  server.delete(
    "/cart/items/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = cartItemParamsSchema.parse(request.params)

        return await removeCartItem({
          userId: request.user!.userId,
          cartItemId: params.id,
        })
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )

  server.delete(
    "/cart",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        return await clearCartForUser(request.user!.userId)
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )

  server.post(
    "/cart/checkout",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const checkout = await checkoutCartForUser(request.user!.userId)
        return reply.status(201).send({ orderId: checkout.orderId })
      } catch (err: unknown) {
        request.log.error(err)
        return sendCartError(reply, err)
      }
    }
  )
}
