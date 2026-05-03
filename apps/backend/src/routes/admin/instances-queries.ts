import { FastifyInstance } from "fastify"
import { registerAdminInstanceExpiryRoutes } from "./instances-expiry.js"
import { registerAdminInstancesListRoutes } from "./instances-list.js"
import { registerAdminInstanceDetailRoutes } from "./instances-detail.js"

export async function registerAdminInstancesQueryRoutes(
  server: FastifyInstance
) {
  await registerAdminInstanceExpiryRoutes(server)
  await registerAdminInstancesListRoutes(server)
  await registerAdminInstanceDetailRoutes(server)
}
