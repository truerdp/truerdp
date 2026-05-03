import { FastifyInstance } from "fastify"
import z from "zod"
import { listActivePlansWithPricing } from "../services/plan.js"
import type { GenericRouteRequest, RouteReply } from "../types/requests.js"
import {
  listPlansSchema,
  listPlanCategoriesSchema,
} from "../schemas/plan.schemas.js"

export async function planRoutes(server: FastifyInstance) {
  const planQuerySchema = z.object({
    planType: z.enum(["Dedicated", "Residential"]).optional(),
    planLocation: z.string().trim().min(1).optional(),
  })

  server.get(
    "/plans",
    { schema: listPlansSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const query = planQuerySchema.parse(request.query ?? {})
        const plans = await listActivePlansWithPricing()

        return plans.filter((plan) => {
          if (query.planType && plan.planType !== query.planType) {
            return false
          }

          if (
            query.planLocation &&
            plan.planLocation.toLowerCase() !== query.planLocation.toLowerCase()
          ) {
            return false
          }

          return true
        })
      } catch (err: unknown) {
        server.log.error(err)
        if (err instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request",
            details: err.issues,
          })
        }

        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/plans/categories",
    { schema: listPlanCategoriesSchema },
    async (_request, reply: RouteReply) => {
      try {
        const plans = await listActivePlansWithPricing()
        const planTypes = Array.from(
          new Set(plans.map((plan) => plan.planType))
        )
        const planLocations = Array.from(
          new Set(plans.map((plan) => plan.planLocation))
        )

        return {
          planTypes,
          planLocations,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )
}
