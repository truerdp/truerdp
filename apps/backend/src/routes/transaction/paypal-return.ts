import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import z from "zod"
import { db } from "../../db.js"
import { transactions } from "../../schema.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  buildPayPalCaptureEvent,
  capturePayPalOrder,
} from "../../services/paypal-payments.js"
import { ingestPaymentWebhook } from "../../services/payment-webhooks.js"
import { getErrorMessage } from "../../utils/error.js"
import { readStringMetadata, transactionParamsSchema } from "./shared.js"

const paypalReturnQuerySchema = z.object({
  token: z.string().trim().min(1),
})

function getWebBaseUrl() {
  const configured = process.env.WEB_BASE_URL?.trim()
  return configured && configured.length > 0
    ? configured
    : "http://localhost:3000"
}

function buildSuccessRedirect(transactionId: number) {
  return new URL(
    `/checkout/success/${transactionId}`,
    getWebBaseUrl()
  ).toString()
}

function isAlreadyCapturedError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("ORDER_ALREADY_CAPTURED") ||
      error.message.includes("already captured"))
  )
}

export async function registerTransactionPayPalReturnRoutes(
  server: FastifyInstance
) {
  server.get(
    "/transactions/:transactionId/paypal-return",
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const { transactionId } = transactionParamsSchema.parse(request.params)
        const { token } = paypalReturnQuerySchema.parse(request.query)

        const [transaction] = await db
          .select({
            id: transactions.id,
            method: transactions.method,
            status: transactions.status,
            reference: transactions.reference,
            metadata: transactions.metadata,
          })
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1)

        if (!transaction) {
          return reply.status(404).send({ error: "Transaction not found" })
        }

        if (transaction.method !== "paypal_checkout") {
          return reply.status(400).send({
            error: "Transaction is not a PayPal checkout",
          })
        }

        const paypalOrderId = readStringMetadata(
          transaction.metadata,
          "paypal_order_id"
        )

        if (!paypalOrderId || paypalOrderId !== token) {
          return reply.status(400).send({
            error: "Invalid PayPal return token",
          })
        }

        if (transaction.status === "pending") {
          try {
            const capture = await capturePayPalOrder(paypalOrderId)
            const payload = buildPayPalCaptureEvent({
              orderId: paypalOrderId,
              capture:
                capture && typeof capture === "object" && !Array.isArray(capture)
                  ? (capture as Record<string, unknown>)
                  : {},
              reference: transaction.reference,
            })

            await ingestPaymentWebhook({
              provider: "paypal",
              payload,
            })
          } catch (error) {
            if (isAlreadyCapturedError(error)) {
              await ingestPaymentWebhook({
                provider: "paypal",
                payload: buildPayPalCaptureEvent({
                  eventId: `paypal:already-captured:${paypalOrderId}`,
                  orderId: paypalOrderId,
                  capture: {},
                  reference: transaction.reference,
                }),
              })
            } else {
              throw error
            }
          }
        }

        return reply.redirect(buildSuccessRedirect(transaction.id))
      } catch (err: unknown) {
        request.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err, "Unable to capture PayPal payment"),
        })
      }
    }
  )
}
