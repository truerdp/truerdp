import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  formatInstanceSummary,
  getInstanceSummaryById,
} from "../instance/shared.js"
import { getInstanceSchema } from "../../schemas/instance.schemas.js"

export async function registerInstanceDetailRoutes(server: FastifyInstance) {
  server.get(
    "/instances/:id",
    { preHandler: verifyAuth, schema: getInstanceSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number(
          (request.params as Record<string, unknown>).id
        )
        const userId = request.user!.userId

        const instance = await getInstanceSummaryById(instanceId)

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        return formatInstanceSummary(instance)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
