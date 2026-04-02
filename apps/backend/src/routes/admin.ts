import { FastifyInstance } from "fastify"
import { db } from "../db.js"
import { transactions, instances, plans, users } from "../schema.js"
import { eq } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { sql } from "drizzle-orm"
import z from "zod"

const provisionSchema = z.object({
  ipAddress: z.string(),
  username: z.string(),
  password: z.string(),
})

export async function adminRoutes(server: FastifyInstance) {
  // Admin route to provision an instance for a transaction
  server.post(
    "/admin/transactions/:id/confirm",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const transactionId = Number(request.params.id)
        const user = request.user

        // ✅ Admin check
        if (user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        // ✅ Get transaction
        const txResult = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1)

        const tx = txResult[0]

        if (!tx) {
          return reply.status(404).send({ error: "Transaction not found" })
        }

        if (tx.status !== "pending") {
          return reply.status(400).send({
            error: "Already processed",
          })
        }

        // ✅ Get plan
        const planResult = await db
          .select()
          .from(plans)
          .where(eq(plans.id, tx.planId))
          .limit(1)

        const plan = planResult[0]

        if (!plan) {
          return reply.status(400).send({ error: "Invalid plan" })
        }

        const now = new Date()

        let instance = null

        // ===============================
        // 🔵 RENEWAL FLOW
        // ===============================
        if (tx.instanceId) {
          const instanceResult = await db
            .select()
            .from(instances)
            .where(eq(instances.id, tx.instanceId))
            .limit(1)

          const existingInstance = instanceResult[0]

          if (!existingInstance) {
            return reply.status(404).send({ error: "Instance not found" })
          }

          // 🧠 Expiry logic
          const baseDate =
            existingInstance.expiryDate && existingInstance.expiryDate > now
              ? existingInstance.expiryDate
              : now

          const newExpiry = new Date(baseDate)
          newExpiry.setDate(baseDate.getDate() + plan.durationDays)

          // ✅ Update instance
          await db
            .update(instances)
            .set({
              expiryDate: newExpiry,
              status: "active",
            })
            .where(eq(instances.id, existingInstance.id))

          instance = {
            ...existingInstance,
            expiryDate: newExpiry,
            status: "active",
          }
        }

        // ===============================
        // 🟢 NEW PURCHASE FLOW
        // ===============================
        else {
          const instanceResult = await db
            .insert(instances)
            .values({
              userId: tx.userId,
              planId: plan.id,
              status: "pending",
            })
            .returning()

          instance = instanceResult[0]
        }

        // ✅ Update transaction
        await db
          .update(transactions)
          .set({
            status: "confirmed",
            confirmedAt: new Date(),
          })
          .where(eq(transactions.id, tx.id))

        return {
          message: tx.instanceId
            ? "Renewal successful. Instance extended."
            : "Payment confirmed. Instance pending provisioning.",
          instance,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  //✅ Admin route to provision instance with IP and credentials (for now)
  server.post(
    "/admin/instances/:id/provision",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const user = request.user

        if (user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const body = provisionSchema.parse(request.body)

        // ✅ Get instance
        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.status !== "pending") {
          return reply.status(400).send({
            error: "Instance already provisioned",
          })
        }

        const now = new Date()

        // ⚠️ FIX: use plan duration instead of hardcoded 30
        const planResult = await db
          .select()
          .from(plans)
          .where(eq(plans.id, instance.planId))
          .limit(1)

        const plan = planResult[0]

        if (!plan) {
          return reply.status(400).send({ error: "Invalid plan" })
        }

        const expiry = new Date()
        expiry.setDate(now.getDate() + plan.durationDays)

        // ✅ Update instance
        await db
          .update(instances)
          .set({
            status: "active",
            ipAddress: body.ipAddress,
            username: body.username,
            password: body.password,
            startDate: now,
            expiryDate: expiry,
          })
          .where(eq(instances.id, instance.id))

        return {
          message: "Instance provisioned successfully",
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  // Admin route to view pending transactions
  server.get(
    "/admin/transactions/pending",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (request.user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const result = await db
          .select()
          .from(transactions)
          .where(eq(transactions.status, "pending"))

        return result
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Admin route to view all instances
  server.get(
    "/admin/instances",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (request.user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const result = await db.select().from(instances)

        return result.map((i) => ({
          id: i.id,
          userId: i.userId,
          status: i.status,
          ipAddress: i.ipAddress,
          startDate: i.startDate,
          expiryDate: i.expiryDate,
        }))
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Admin route to view stats
  server.get(
    "/admin/stats",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (request.user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const totalUsers = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)

        const totalTransactions = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)

        const totalRevenue = await db
          .select({ sum: sql<number>`coalesce(sum(amount), 0)` })
          .from(transactions)
          .where(eq(transactions.status, "confirmed"))

        return {
          users: totalUsers[0]?.count ?? 0,
          transactions: totalTransactions[0]?.count ?? 0,
          revenue: totalRevenue[0]?.sum ?? 0,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
