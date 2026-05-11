import { FastifyInstance } from "fastify"
import { registerAdminSupportRoutes } from "./support/admin.js"
import { registerPublicSupportRoutes } from "./support/public.js"
import { registerUserSupportRoutes } from "./support/user.js"

export async function supportRoutes(server: FastifyInstance) {
  registerPublicSupportRoutes(server)
  registerUserSupportRoutes(server)
  registerAdminSupportRoutes(server)
}
