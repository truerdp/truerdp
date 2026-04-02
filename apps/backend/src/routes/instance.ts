import { FastifyInstance } from "fastify"
import { db } from "../db.js"
import { instances } from "../schema.js"
import { eq } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { transactions } from "../schema.js"
import { calculatePrice } from "../services/pricing.js"

export async function instanceRoutes(server: FastifyInstance) {
  // Route for users to view their provisioned instances
  server.get(
    "/instances",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.userId, userId))

        const now = new Date()

        // ⚠️ IMPORTANT: hide sensitive fields
        const safeData = result.map((i) => {
          let status = i.status

          if (i.expiryDate && i.expiryDate < now && i.status === "active") {
            status = "expired"
          }

          return {
            id: i.id,
            status,
            ipAddress: i.ipAddress,
            username: i.username,
            startDate: i.startDate,
            expiryDate: i.expiryDate,
          }
        })

        return safeData
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Route for users to view details of a specific instance
  server.get(
    "/instances/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        // ✅ Ownership check
        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        return {
          id: instance.id,
          status: instance.status,
          ipAddress: instance.ipAddress,
          username: instance.username,
          startDate: instance.startDate,
          expiryDate: instance.expiryDate,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Route for users to get credentials of a specific instance
  server.post(
    "/instances/:id/credentials",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        // ✅ Ownership check
        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        // ⚠️ Optional: only allow if active
        if (instance.status !== "active") {
          return reply.status(400).send({
            error: "Instance not active",
          })
        }

        return {
          ipAddress: instance.ipAddress,
          username: instance.username,
          password: instance.password,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  //✅ Route for users to renew an instance (creates a new transaction)
  server.post(
    "/instances/:id/renew",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const userId = request.user.userId

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

        if (instance.userId !== userId) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const amount = await calculatePrice(userId, instance.planId)

        // ✅ Create renewal transaction
        const tx = await db
          .insert(transactions)
          .values({
            userId,
            planId: instance.planId,
            instanceId: instance.id, // 👈 ADD THIS LINE
            amount, // ✅ correct now
            method: "upi", // temporary
          })
          .returning()

        return {
          message: "Renewal initiated",
          transaction: tx[0],
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
