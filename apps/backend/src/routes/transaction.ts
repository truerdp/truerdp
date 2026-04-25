import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db.js"
import { verifyAuth } from "../middleware/auth.js"
import { transactions } from "../schema.js"
import {
  BillingError,
  createBillingTransaction,
  listUserInvoices,
  listUserTransactions,
  supportedPaymentMethodSchema,
} from "../services/billing.js"
import { normalizeCoinGateOrderStatus } from "../services/coingate-payments.js"
import { ingestPaymentWebhook } from "../services/payment-webhooks.js"

const createTransactionSchema = z.object({
  orderId: z.number().int().positive(),
  method: supportedPaymentMethodSchema,
})

const transactionParamsSchema = z.object({
  transactionId: z.coerce.number().int().positive(),
})

function readStringMetadata(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null
  }

  const value = (metadata as Record<string, unknown>)[key]

  if (typeof value === "string" && value.trim()) {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return null
}

export async function transactionRoutes(server: FastifyInstance) {
  server.post(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const body = createTransactionSchema.parse(request.body)
        const userId = request.user.userId

        const transaction = await createBillingTransaction({
          userId,
          orderId: body.orderId,
          method: body.method,
          ipAddress: request.ip,
        })

        return reply.status(201).send(transaction)
      } catch (err: any) {
        server.log.error(err)

        if (err instanceof BillingError) {
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.get(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        return await listUserTransactions(request.user.userId)
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/transactions/:transactionId/sync-coingate",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const { transactionId } = transactionParamsSchema.parse(request.params)
        const userId = request.user.userId

        const [transaction] = await db
          .select({
            id: transactions.id,
            userId: transactions.userId,
            method: transactions.method,
            status: transactions.status,
            metadata: transactions.metadata,
          })
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1)

        if (!transaction) {
          return reply.status(404).send({ error: "Transaction not found" })
        }

        if (transaction.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (transaction.method !== "coingate_checkout") {
          return reply.status(400).send({
            error: "Transaction is not a CoinGate checkout",
          })
        }

        const coingateOrderId = readStringMetadata(
          transaction.metadata,
          "coingate_order_id"
        )

        if (!coingateOrderId) {
          return reply.status(400).send({
            error: "Transaction is missing CoinGate order metadata",
          })
        }

        const parsedOrderId = Number.parseInt(coingateOrderId, 10)

        if (!Number.isFinite(parsedOrderId)) {
          return reply.status(400).send({
            error: "Transaction has invalid CoinGate order metadata",
          })
        }

        const payload = await normalizeCoinGateOrderStatus(parsedOrderId)
        const result = await ingestPaymentWebhook({
          provider: "coingate",
          payload,
        })

        return {
          message: "CoinGate transaction sync complete",
          ...result,
        }
      } catch (err: any) {
        request.log.error(err)
        return reply.status(400).send({
          error: err.message || "Unable to sync CoinGate transaction",
        })
      }
    }
  )

  server.get(
    "/invoices",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        return await listUserInvoices(request.user.userId)
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
