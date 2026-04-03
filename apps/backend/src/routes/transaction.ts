import { FastifyInstance } from "fastify"
import { db } from "../db.js"
import { transactions, plans, instances } from "../schema.js"
import { z } from "zod"
import { and, desc, eq } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { calculatePrice } from "../services/pricing.js"

const createTransactionSchema = z.object({
  planId: z.number(),
  method: z.enum(["upi", "usdt_trc20"]),
  instanceId: z.number().optional(),
})

export async function transactionRoutes(server: FastifyInstance) {
  // ✅ Create transaction
  server.post(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const body = createTransactionSchema.parse(request.body)

        const userId = request.user.userId

        // ✅ 1. Validate plan exists
        const planResult = await db
          .select()
          .from(plans)
          .where(eq(plans.id, body.planId))
          .limit(1)

        const plan = planResult[0]

        if (!plan) {
          return reply.status(400).send({ error: "Invalid planId" })
        }

        // ✅ 2. If instanceId is provided, validate it belongs to the user and doesn't have pending transactions
        if (body.instanceId) {
          const instanceResult = await db
            .select()
            .from(instances)
            .where(eq(instances.id, body.instanceId))
            .limit(1)

          const instance = instanceResult[0]

          if (!instance) {
            return reply.status(400).send({ error: "Invalid instanceId" })
          }

          if (instance.userId !== userId) {
            return reply.status(403).send({ error: "Forbidden" })
          }

          const pendingTxResult = await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.instanceId, body.instanceId),
                eq(transactions.status, "pending")
              )
            )
            .limit(1)

          if (pendingTxResult.length > 0) {
            return reply.status(400).send({
              error: "Pending transaction already exists",
            })
          }
        }

        // ✅ 3. Calculate price
        const amount = await calculatePrice(userId, body.planId)

        // ✅ 4. Create transaction
        const tx = await db
          .insert(transactions)
          .values({
            userId,
            planId: plan.id,
            amount,
            instanceId: body.instanceId || null,
            method: body.method,
            status: "pending",
          })
          .returning()

        return reply.status(201).send(tx[0])
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  // ✅ Get user transactions
  server.get(
    "/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId

        const txs = await db
          .select()
          .from(transactions)
          .where(eq(transactions.userId, userId))
          .orderBy(desc(transactions.createdAt))

        return txs.map((tx) => ({
          id: tx.id,
          planId: tx.planId,
          amount: tx.amount,
          method: tx.method,
          status: tx.status,
          createdAt: tx.createdAt,
          confirmedAt: tx.confirmedAt,
        }))
      } catch (err: any) {
        request.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
