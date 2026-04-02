import { FastifyInstance } from "fastify"
import { db } from "../db.js"
import { transactions, plans, users } from "../schema.js"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { calculatePrice } from "../services/pricing.js"

const createTransactionSchema = z.object({
  planId: z.number(),
  method: z.enum(["upi", "usdt_trc20"]),
})

export async function transactionRoutes(server: FastifyInstance) {
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

        // ✅ 2. Get user for discount
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        const user = userResult[0]

        if (!user) {
          return reply.status(401).send({ error: "User not found" })
        }

        // ✅ 3. Calculate price
        const amount = await calculatePrice(userId, body.planId)

        // let amount = plan.price

        // if (user.discountPercent) {
        //   amount = amount - (amount * user.discountPercent) / 100
        // }

        // if (user.discountFlat) {
        //   amount = amount - user.discountFlat
        // }

        // if (amount < 0) amount = 0

        // ✅ 4. Create transaction
        const tx = await db
          .insert(transactions)
          .values({
            userId,
            planId: plan.id,
            amount,
            method: body.method,
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
}
