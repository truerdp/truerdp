import { FastifyInstance } from "fastify"
import { registerAdminSupportRoutes } from "./support/admin.js"
import { registerUserSupportRoutes } from "./support/user.js"

export async function supportRoutes(server: FastifyInstance) {
  registerUserSupportRoutes(server)
  registerAdminSupportRoutes(server)
}

