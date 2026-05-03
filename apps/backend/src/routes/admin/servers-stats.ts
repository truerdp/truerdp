import { FastifyInstance } from "fastify"
import { registerAdminServersListRoutes } from "./servers-list.js"
import { registerAdminServersMutationRoutes } from "./servers-mutations.js"
import { registerAdminStatsRoutes } from "./stats.js"

export async function registerAdminServersStatsRoutes(server: FastifyInstance) {
  await registerAdminServersListRoutes(server)
  await registerAdminServersMutationRoutes(server)
  await registerAdminStatsRoutes(server)
}
