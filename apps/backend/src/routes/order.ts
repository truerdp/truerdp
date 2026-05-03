import { FastifyInstance } from "fastify"
import { z } from "zod"
import { verifyAuth } from "../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../types/requests.js"
import {
  BillingError,
  applyCouponToBillingOrder,
  createBillingOrder,
  getBillingOrderForUser,
  removeCouponFromBillingOrder,
  updateBillingDetailsForUser,
} from "../services/billing.js"
import { getErrorMessage } from "../utils/error.js"

const createOrderSchema = z.object({
  planPricingId: z.number().int().positive(),
  instanceId: z.number().int().positive().optional(),
})

const couponSchema = z.object({
  code: z.string().trim().min(1).optional().nullable(),
})

const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const optionalBillingFieldSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length === 0 ? null : trimmed
  })

const requiredBillingFieldSchema = z.string().trim().min(1, "Phone is required")

const billingDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  phone: requiredBillingFieldSchema,
  companyName: optionalBillingFieldSchema,
  taxId: optionalBillingFieldSchema,
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: optionalBillingFieldSchema,
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
})

export async function orderRoutes(server: FastifyInstance) {
  server.post(
    "/orders",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = createOrderSchema.parse(request.body ?? {})
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

  server.get(
    "/orders/:id",
    { preHandler: verifyAuth },
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

  server.patch(
    "/orders/:id/billing",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = orderIdParamsSchema.parse(request.params)
        const billingDetails = billingDetailsSchema.parse(request.body ?? {})
        const userId = request.user!.userId

        const updated = await updateBillingDetailsForUser({
          userId,
          orderId: params.id,
          billingDetails,
        })

        return reply.send({
          message: "Billing details saved",
          orderId: updated.orderId,
          billingDetails: updated.billingDetails,
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

  server.patch(
    "/orders/:id/coupon",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const params = orderIdParamsSchema.parse(request.params)
        const body = couponSchema.parse(request.body ?? {})
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
            body.code && body.code.trim()
              ? "Coupon applied"
              : "Coupon removed",
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
