import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  formatInstanceSummary,
  listUserInstanceSummaries,
} from "../instance/shared.js"
import { listInstancesSchema } from "../../schemas/instance.schemas.js"

export async function registerInstanceListRoutes(server: FastifyInstance) {
  server.get(
    "/instances",
    { preHandler: verifyAuth, schema: listInstancesSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        const userId = request.user!.userId

        const instancesList = await listUserInstanceSummaries(userId)
        return instancesList.map(formatInstanceSummary)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
