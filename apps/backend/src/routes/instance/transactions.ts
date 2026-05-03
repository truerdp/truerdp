import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { listInstanceTransactions } from "../../services/billing.js"
import { getUserOwnedInstance } from "./shared.js"

export function registerInstanceTransactionRoutes(server: FastifyInstance) {
  server.get(
    "/instances/:id/transactions",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number((request.params as Record<string, unknown>).id)
        const userId = request.user!.userId
        const instance = await getUserOwnedInstance(instanceId, userId)

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        const txs = await listInstanceTransactions(userId, instanceId)

        return txs.map((tx) => ({
          id: tx.id,
          status: tx.status,
          amount: tx.amount,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
          kind: tx.kind,
          invoice: tx.invoice,
        }))
      } catch (err: unknown) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
