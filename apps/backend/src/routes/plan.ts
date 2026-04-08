import { FastifyInstance } from "fastify"
import { listActivePlansWithPricing } from "../services/plan.js"

export async function planRoutes(server: FastifyInstance) {
  server.get("/plans", async (_request, reply) => {
    try {
      return await listActivePlansWithPricing()
    } catch (err: any) {
      server.log.error(err)
      return reply.status(500).send({
        error: "Internal server error",
      })
    }
  })
}
