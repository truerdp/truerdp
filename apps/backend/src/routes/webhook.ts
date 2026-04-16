import { FastifyInstance } from "fastify"
import z from "zod"
import { ingestPaymentWebhook } from "../services/payment-webhooks.js"
import { verifyRazorpaySignature } from "../services/webhook-adapters/razorpay.js"

const webhookParamsSchema = z.object({
  provider: z.string().trim().min(1),
})

export async function webhookRoutes(server: FastifyInstance) {
  server.post("/webhooks/payments/:provider", async (request: any, reply) => {
    try {
      const { provider } = webhookParamsSchema.parse(request.params)

      // Verify signature based on provider
      if (provider === "razorpay") {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET

        if (!secret) {
          request.log.warn(
            "RAZORPAY_WEBHOOK_SECRET not configured; skipping signature verification"
          )
        } else {
          const signature = request.headers["x-razorpay-signature"]
          const isValid = verifyRazorpaySignature({
            body: request.rawBody ?? JSON.stringify(request.body),
            signature,
            secret,
          })

          if (!isValid) {
            return reply.status(401).send({
              error: "Invalid signature",
            })
          }
        }
      }

      const result = await ingestPaymentWebhook({
        provider,
        payload: request.body,
      })

      return reply.status(202).send({
        message: "Webhook received",
        ...result,
      })
    } catch (err: any) {
      request.log.error(err)
      return reply.status(400).send({
        error: err.message || "Invalid webhook request",
      })
    }
  })
}
