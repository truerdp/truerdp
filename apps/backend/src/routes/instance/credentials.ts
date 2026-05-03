import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { decryptCredential } from "../../services/resource-credentials.js"
import {
  getEffectiveInstanceStatus,
  getInstanceCredentialsById,
} from "../instance/shared.js"
import { getInstanceCredentialsSchema } from "../../schemas/instance.schemas.js"

export async function registerInstanceCredentialsRoutes(
  server: FastifyInstance
) {
  server.post(
    "/instances/:id/credentials",
    { preHandler: verifyAuth, schema: getInstanceCredentialsSchema },
    async (request: GenericRouteRequest, reply) => {
      try {
        const instanceId = Number(
          (request.params as Record<string, unknown>).id
        )
        const userId = request.user!.userId

        const instance = await getInstanceCredentialsById(instanceId)

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (getEffectiveInstanceStatus(instance) !== "active") {
          return reply.status(400).send({
            error: "Instance not active",
          })
        }

        if (
          !instance.ipAddress ||
          !instance.username ||
          !instance.passwordEncrypted
        ) {
          return reply.status(400).send({
            error: "Instance credentials are not available",
          })
        }

        return {
          ipAddress: instance.ipAddress,
          username: instance.username,
          password: decryptCredential(instance.passwordEncrypted),
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
