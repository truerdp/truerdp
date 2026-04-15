import { FastifyInstance } from "fastify"
import { and, asc, desc, eq, gte, lt, ne, sql } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import {
  instances,
  invoices,
  orders,
  resources,
  transactions,
  users,
} from "../schema.js"
import { verifyAuth } from "../middleware/auth.js"
import {
  BillingError,
  confirmPendingTransaction,
  listPendingTransactions,
} from "../services/billing.js"
import { encryptCredential } from "../services/resource-credentials.js"

const provisionSchema = z.object({
  provider: z.string().trim().min(1).default("manual"),
  externalId: z.string().trim().min(1).optional(),
  ipAddress: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(1),
})

const extendInstanceSchema = z.object({
  days: z.number().int().positive(),
})

function requireAdmin(user: any, reply: any) {
  if (user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}

export async function adminRoutes(server: FastifyInstance) {
  server.post(
    "/admin/transactions/:id/confirm",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const transactionId = Number(request.params.id)

        if (!requireAdmin(request.user, reply)) {
          return
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

  server.post(
    "/admin/instances/:id/provision",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(instanceId)) {
          return reply.status(400).send({ error: "Invalid instance id" })
        }

        const body = provisionSchema.parse(request.body)

        const instanceResult = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = instanceResult[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (!["pending", "provisioning", "failed"].includes(instance.status)) {
          return reply.status(400).send({
            error: "Instance cannot be provisioned in its current state",
          })
        }

        const linkedOrderResult = await db
          .select({
            id: orders.id,
            durationDays: orders.durationDays,
            status: orders.status,
          })
          .from(orders)
          .where(eq(orders.id, instance.originOrderId))
          .limit(1)

        const linkedOrder = linkedOrderResult[0]

        if (!linkedOrder) {
          return reply.status(400).send({
            error: "Instance is missing its originating order",
          })
        }

        const now = new Date()
        const expiry = new Date(now)
        expiry.setDate(expiry.getDate() + linkedOrder.durationDays)

        await db.transaction(async (tx) => {
          await tx
            .update(instances)
            .set({
              status: "active",
              startDate: now,
              expiryDate: expiry,
              provisionAttempts: instance.provisionAttempts + 1,
              lastProvisionError: null,
            })
            .where(eq(instances.id, instance.id))

          await tx
            .insert(resources)
            .values({
              instanceId: instance.id,
              provider: body.provider,
              externalId: body.externalId,
              ipAddress: body.ipAddress,
              username: body.username,
              passwordEncrypted: encryptCredential(body.password),
              status: "running",
              lastSyncedAt: now,
              healthStatus: "healthy",
            })
            .onConflictDoUpdate({
              target: resources.instanceId,
              set: {
                provider: body.provider,
                externalId: body.externalId,
                ipAddress: body.ipAddress,
                username: body.username,
                passwordEncrypted: encryptCredential(body.password),
                status: "running",
                lastSyncedAt: now,
                healthStatus: "healthy",
                updatedAt: now,
              },
            })

          await tx
            .update(orders)
            .set({
              status: "completed",
            })
            .where(eq(orders.id, linkedOrder.id))
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

  server.post(
    "/admin/instances/:id/terminate",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)

        if (!requireAdmin(request.user, reply)) {
          return
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

          await tx
            .update(resources)
            .set({
              status: "deleted",
              lastSyncedAt: terminatedAt,
              updatedAt: terminatedAt,
            })
            .where(eq(resources.instanceId, instance.id))
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

  server.post(
    "/admin/instances/:id/extend",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const instanceId = Number(request.params.id)
        const body = extendInstanceSchema.parse(request.body)

        if (!requireAdmin(request.user, reply)) {
          return
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

  server.get(
    "/admin/transactions/pending",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
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

  server.get(
    "/admin/instances/expired",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
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
              lt(instances.expiryDate, today)
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

  server.get(
    "/admin/instances/expiring-soon",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
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

  server.get(
    "/admin/instances",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const result = await db
          .select({
            id: instances.id,
            userId: instances.userId,
            status: instances.status,
            startDate: instances.startDate,
            expiryDate: instances.expiryDate,
            ipAddress: resources.ipAddress,
            provider: resources.provider,
            resourceStatus: resources.status,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .orderBy(desc(instances.createdAt))

        return result
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/stats",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const totalUsers = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)

        const totalTransactions = await db
          .select({ count: sql<number>`count(*)` })
          .from(transactions)

        const totalRevenue = await db
          .select({
            sum: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)`,
          })
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
