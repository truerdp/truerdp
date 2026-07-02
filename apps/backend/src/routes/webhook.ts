import { FastifyInstance } from "fastify"
import z from "zod"
import { ingestPaymentWebhook } from "../services/payment-webhooks.js"
import { verifyAndUnwrapDodoWebhook } from "../services/dodo-payments.js"
import { verifyAndNormalizeCoinGateWebhook } from "../services/coingate-payments.js"
import {
  preparePayPalWebhookForIngest,
  verifyAndUnwrapPayPalWebhook,
} from "../services/paypal-payments.js"
import { getErrorMessage } from "../utils/error.js"
import type { GenericRouteRequest, RouteReply } from "../types/requests.js"

const webhookParamsSchema = z.object({
  provider: z.enum(["dodo", "coingate", "paypal", "mock"]),
})

export async function webhookRoutes(server: FastifyInstance) {
  server.post(
    "/webhooks/payments/:provider",
    {
      config: {
        rawBody: true,
      },
    },
    async (request: GenericRouteRequest, reply: RouteReply) => {
    try {
      const { provider } = webhookParamsSchema.parse(request.params)

      let payloadToIngest: unknown = request.body

      // Verify signature based on provider
      if (provider === "dodo") {
        // Dodo Payments webhook verification requires exact raw body bytes
        const rawBodyValue = request.rawBody
        const rawBody =
          typeof rawBodyValue === "string"
            ? rawBodyValue
            : Buffer.isBuffer(rawBodyValue)
              ? rawBodyValue.toString("utf8")
              : JSON.stringify(request.body)

        try {
          payloadToIngest = verifyAndUnwrapDodoWebhook(
            rawBody,
            request.headers as Record<string, string | string[] | undefined>
          )
        } catch (e: unknown) {
          request.log.error(e)
          return reply.status(401).send({ error: "Invalid Dodo signature" })
        }
      } else if (provider === "coingate") {
        try {
          payloadToIngest = await verifyAndNormalizeCoinGateWebhook({
            payload: request.body,
            rawBody: request.rawBody,
          })
        } catch (e: unknown) {
          request.log.error(e)
          return reply.status(401).send({
            error: getErrorMessage(e, "Invalid CoinGate webhook"),
          })
        }
      } else if (provider === "paypal") {
        try {
          const verifiedPayload = await verifyAndUnwrapPayPalWebhook({
            payload: request.body,
            rawBody: request.rawBody,
            headers: request.headers as Record<
              string,
              string | string[] | undefined
            >,
          })
          payloadToIngest = await preparePayPalWebhookForIngest(verifiedPayload)
        } catch (e: unknown) {
          request.log.error(e)
          return reply.status(401).send({
            error: getErrorMessage(e, "Invalid PayPal webhook"),
          })
        }
      } else if (provider === "mock" && process.env.NODE_ENV === "production") {
        return reply.status(404).send({ error: "Unknown provider" })
      }

      const result = await ingestPaymentWebhook({
        provider,
        payload: payloadToIngest,
      })

      return reply.status(202).send({
        message: "Webhook received",
        ...result,
      })
    } catch (err: unknown) {
      request.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err, "Invalid webhook request"),
      })
    }
  })
}
