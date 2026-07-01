import { FastifyInstance } from "fastify"
import { getPublicPaymentSettings } from "../services/billing.js"
import { getPublicPaymentSettingsSchema } from "../schemas/payment-settings.schemas.js"

export async function paymentSettingsRoutes(server: FastifyInstance) {
  server.get(
    "/payment-settings",
    { schema: getPublicPaymentSettingsSchema },
    async (_request, reply) => {
      try {
        return await getPublicPaymentSettings()
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
