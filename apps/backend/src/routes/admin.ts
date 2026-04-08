import { FastifyInstance } from "fastify"
import { db } from "../db.js"
import {
  transactions,
  instances,
  users,
  servers,
  invoices,
  orders,
} from "../schema.js"
import { and, asc, desc, eq, gte, lt, ne, or } from "drizzle-orm"
import { verifyAuth } from "../middleware/auth.js"
import { sql } from "drizzle-orm"
import z from "zod"
import {
  BillingError,
  confirmPendingTransaction,
  listPendingTransactions,
} from "../services/billing.js"

const provisionSchema = z.object({
  ipAddress: z.string(),
  username: z.string(),
  password: z.string(),
})

const extendInstanceSchema = z.object({
  days: z.number().int().positive(),
})

export async function adminRoutes(server: FastifyInstance) {
  server.post(
    "/admin/transactions/:id/confirm",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const transactionId = Number(request.params.id)
        const user = request.user

        if (user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (Number.isNaN(transactionId)) {
          return reply.status(400).send({ error: "Invalid transaction id" })
        }

        return await confirmPendingTransaction(transactionId)
      } catch (err: any) {
        server.log.error(err)

        if (err instanceof BillingError) {
          return reply.status(err.statusCode).send({
            error: err.message,
          })
        }

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
        const linkedOrderResult = await db
          .select({
            orderId: orders.id,
            durationDays: orders.durationDays,
          })
          .from(transactions)
          .innerJoin(invoices, eq(transactions.invoiceId, invoices.id))
          .innerJoin(orders, eq(invoices.orderId, orders.id))
          .where(
            and(
              eq(transactions.status, "confirmed"),
              sql`${transactions.metadata} ->> 'instanceId' = ${String(instance.id)}`,
              sql`${transactions.metadata} ->> 'purchaseType' = 'new_purchase'`
            )
          )
          .orderBy(desc(transactions.createdAt))
          .limit(1)

        const linkedOrder = linkedOrderResult[0]

        if (!linkedOrder) {
          return reply.status(400).send({
            error: "No paid purchase found for this instance",
          })
        }

        const expiry = new Date(now)
        expiry.setDate(expiry.getDate() + linkedOrder.durationDays)

        await db.transaction(async (tx) => {
          await tx
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

          await tx
            .update(orders)
            .set({
              status: "completed",
            })
            .where(eq(orders.id, linkedOrder.orderId))
        })

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

  // Admin route to terminate an instance
  server.post(
    "/admin/instances/:id/terminate",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const user = request.user

        if (user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (Number.isNaN(instanceId)) {
          return reply.status(400).send({ error: "Invalid instance id" })
        }

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.status === "terminated") {
          return reply
            .status(400)
            .send({ error: "Instance already terminated" })
        }

        const terminatedAt = new Date()

        await db.transaction(async (tx) => {
          await tx
            .update(instances)
            .set({
              status: "terminated",
              terminatedAt,
            })
            .where(eq(instances.id, instance.id))

          if (instance.serverId) {
            await tx
              .update(servers)
              .set({
                status: "available",
              })
              .where(eq(servers.id, instance.serverId))
          }
        })

        return {
          message: "Instance terminated successfully",
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Admin route to extend an instance expiry date
  server.post(
    "/admin/instances/:id/extend",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const user = request.user
        const body = extendInstanceSchema.parse(request.body)

        if (user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (Number.isNaN(instanceId)) {
          return reply.status(400).send({ error: "Invalid instance id" })
        }

        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.status === "terminated") {
          return reply
            .status(400)
            .send({ error: "Cannot extend a terminated instance" })
        }

        if (!instance.expiryDate) {
          return reply
            .status(400)
            .send({ error: "Instance expiry date not set" })
        }

        const newExpiryDate = new Date(instance.expiryDate)
        newExpiryDate.setDate(newExpiryDate.getDate() + body.days)

        await db
          .update(instances)
          .set({
            expiryDate: newExpiryDate,
          })
          .where(eq(instances.id, instance.id))

        return {
          message: "Instance extended successfully",
          newExpiryDate,
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

        return await listPendingTransactions()
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Admin route to view all expired instances
  server.get(
    "/admin/instances/expired",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (request.user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            planId: instances.planId,
            expiryDate: instances.expiryDate,
            status: instances.status,
            createdAt: instances.createdAt,
          })
          .from(instances)
          .where(
            and(
              ne(instances.status, "terminated"),
              or(
                eq(instances.status, "expired"),
                lt(instances.expiryDate, today)
              )
            )
          )
          .orderBy(asc(instances.expiryDate))

        return result.map((instance) => {
          const expiryDate = instance.expiryDate
            ? new Date(instance.expiryDate)
            : today
          expiryDate.setHours(0, 0, 0, 0)

          const daysSinceExpiry = Math.max(
            0,
            Math.floor(
              (today.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          return {
            ...instance,
            status: "expired" as const,
            daysSinceExpiry,
          }
        })
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  // Admin route to view active instances expiring soon
  server.get(
    "/admin/instances/expiring-soon",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (request.user.role !== "admin") {
          return reply.status(403).send({ error: "Forbidden" })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const threeDaysFromToday = new Date(today)
        threeDaysFromToday.setDate(today.getDate() + 3)

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            planId: instances.planId,
            expiryDate: instances.expiryDate,
            status: instances.status,
            createdAt: instances.createdAt,
          })
          .from(instances)
          .where(
            and(
              eq(instances.status, "active"),
              gte(instances.expiryDate, today),
              lt(instances.expiryDate, threeDaysFromToday)
            )
          )
          .orderBy(asc(instances.expiryDate))

        return result.map((instance) => {
          const expiryDate = instance.expiryDate
            ? new Date(instance.expiryDate)
            : today
          expiryDate.setHours(0, 0, 0, 0)

          const daysUntilExpiry = Math.max(
            0,
            Math.floor(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            )
          )

          return {
            ...instance,
            daysUntilExpiry,
          }
        })
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
          .select({ sum: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)` })
          .from(invoices)
          .where(eq(invoices.status, "paid"))

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
