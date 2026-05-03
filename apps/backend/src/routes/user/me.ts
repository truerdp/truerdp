import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getCurrentUserSchema } from "../../schemas/user.schemas.js"

export async function registerUserMeRoutes(server: FastifyInstance) {
  server.get(
    "/me",
    { preHandler: verifyAuth, schema: getCurrentUserSchema },
    async (request: GenericRouteRequest) => {
      return { user: request.user }
    }
  )
}
