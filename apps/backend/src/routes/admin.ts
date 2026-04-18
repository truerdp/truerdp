import { FastifyInstance } from "fastify"
import { and, asc, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import {
  instances,
  invoices,
  orders,
  planPricing,
  plans,
  resources,
  servers,
  transactions,
  users,
} from "../schema.js"
import { verifyAuth } from "../middleware/auth.js"
import {
  BillingError,
  confirmPendingTransaction,
  listAdminTransactions,
  listPendingTransactions,
} from "../services/billing.js"
import { encryptCredential } from "../services/resource-credentials.js"
import { listAdminPlansWithPricing } from "../services/plan.js"
import {
  allocateServerToInstance,
  AllocationError,
  deallocateServer,
} from "../services/allocation.js"

const provisionSchema = z.object({
  serverId: z.number().int().positive(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).optional(),
})

const extendInstanceSchema = z.object({
  days: z.number().int().positive(),
})

const planPricingInputSchema = z.object({
  id: z.number().int().positive().optional(),
  durationDays: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  isActive: z.boolean().default(true),
})

const createPlanSchema = z.object({
  name: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  cpuName: z.string().trim().min(1).default("Intel Xeon"),
  cpuThreads: z.number().int().positive().default(2),
  ram: z.number().int().positive(),
  ramType: z.string().trim().min(1).default("DDR4"),
  storage: z.number().int().positive(),
  storageType: z.enum(["HDD", "SSD"]).default("SSD"),
  bandwidth: z.string().trim().min(1).default("2TB"),
  os: z.string().trim().min(1).default("Windows"),
  osVersion: z.string().trim().min(1).default("Windows Server 2022"),
  planType: z.enum(["Dedicated", "Residential"]).default("Dedicated"),
  portSpeed: z.string().trim().min(1).default("1Gbps"),
  setupFees: z.number().int().nonnegative().default(0),
  planLocation: z.string().trim().min(1).default("USA"),
  isActive: z.boolean().default(true),
  pricingOptions: z.array(planPricingInputSchema.omit({ id: true })).min(1),
})

const updatePlanSchema = z.object({
  name: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  cpuName: z.string().trim().min(1),
  cpuThreads: z.number().int().positive(),
  ram: z.number().int().positive(),
  ramType: z.string().trim().min(1),
  storage: z.number().int().positive(),
  storageType: z.enum(["HDD", "SSD"]),
  bandwidth: z.string().trim().min(1),
  os: z.string().trim().min(1),
  osVersion: z.string().trim().min(1),
  planType: z.enum(["Dedicated", "Residential"]),
  portSpeed: z.string().trim().min(1),
  setupFees: z.number().int().nonnegative(),
  planLocation: z.string().trim().min(1),
  isActive: z.boolean().default(true),
  defaultPricingId: z.number().int().positive().optional().nullable(),
  pricingOptions: z.array(planPricingInputSchema).min(1),
})

const updatePlanStatusSchema = z.object({
  isActive: z.boolean(),
})

const serverInputSchema = z.object({
  provider: z.string().trim().min(1).default("manual"),
  externalId: z.string().trim().min(1).nullable().optional(),
  ipAddress: z.string().trim().min(1),
  cpu: z.number().int().positive(),
  ram: z.number().int().positive(),
  storage: z.number().int().positive(),
  status: z
    .enum(["available", "assigned", "cleaning", "retired"])
    .default("available"),
})

const serverStatusUpdateSchema = z.object({
  status: z.enum(["available", "assigned", "cleaning", "retired"]),
})

function requireAdmin(user: any, reply: any) {
  if (user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}

export async function adminRoutes(server: FastifyInstance) {
  server.get(
    "/admin/plans",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listAdminPlansWithPricing()
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/admin/plans",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = createPlanSchema.parse(request.body)
        const uniqueDurations = new Set(
          body.pricingOptions.map((x) => x.durationDays)
        )

        if (uniqueDurations.size !== body.pricingOptions.length) {
          return reply.status(400).send({
            error: "Pricing durations must be unique per plan",
          })
        }

        const created = await db.transaction(async (tx) => {
          const [plan] = await tx
            .insert(plans)
            .values({
              name: body.name,
              cpu: body.cpu,
              cpuName: body.cpuName,
              cpuThreads: body.cpuThreads,
              ram: body.ram,
              ramType: body.ramType,
              storage: body.storage,
              storageType: body.storageType,
              bandwidth: body.bandwidth,
              os: body.os,
              osVersion: body.osVersion,
              planType: body.planType,
              portSpeed: body.portSpeed,
              setupFees: body.setupFees,
              planLocation: body.planLocation,
              isActive: body.isActive,
            })
            .returning({
              id: plans.id,
            })

          if (!plan) {
            throw new Error("Failed to create plan")
          }

          await tx.insert(planPricing).values(
            body.pricingOptions.map((option) => ({
              planId: plan.id,
              durationDays: option.durationDays,
              price: option.price,
              isActive: option.isActive,
            }))
          )

          return plan
        })

        return {
          message: "Plan created successfully",
          planId: created.id,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.put(
    "/admin/plans/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const planId = Number(request.params.id)

        if (Number.isNaN(planId)) {
          return reply.status(400).send({ error: "Invalid plan id" })
        }

        const body = updatePlanSchema.parse(request.body)
        const uniqueDurations = new Set(
          body.pricingOptions.map((x) => x.durationDays)
        )

        if (uniqueDurations.size !== body.pricingOptions.length) {
          return reply.status(400).send({
            error: "Pricing durations must be unique per plan",
          })
        }

        const existingPlan = await db
          .select({ id: plans.id })
          .from(plans)
          .where(eq(plans.id, planId))
          .limit(1)

        if (!existingPlan[0]) {
          return reply.status(404).send({
            error: "Plan not found",
          })
        }

        await db.transaction(async (tx) => {
          await tx
            .update(plans)
            .set({
              name: body.name,
              cpu: body.cpu,
              cpuName: body.cpuName,
              cpuThreads: body.cpuThreads,
              ram: body.ram,
              ramType: body.ramType,
              storage: body.storage,
              storageType: body.storageType,
              bandwidth: body.bandwidth,
              os: body.os,
              osVersion: body.osVersion,
              planType: body.planType,
              portSpeed: body.portSpeed,
              setupFees: body.setupFees,
              planLocation: body.planLocation,
              isActive: body.isActive,
              defaultPricingId: body.defaultPricingId ?? null,
            })
            .where(eq(plans.id, planId))

          const existingPricing = await tx
            .select({
              id: planPricing.id,
              durationDays: planPricing.durationDays,
            })
            .from(planPricing)
            .where(eq(planPricing.planId, planId))

          const existingById = new Map(existingPricing.map((x) => [x.id, x]))
          const existingByDuration = new Map(
            existingPricing.map((x) => [x.durationDays, x])
          )
          const touchedPricingIds: number[] = []

          for (const option of body.pricingOptions) {
            if (option.id != null) {
              const matchedById = existingById.get(option.id)

              if (!matchedById) {
                throw new Error(
                  `Pricing option ${option.id} does not belong to this plan`
                )
              }

              await tx
                .update(planPricing)
                .set({
                  durationDays: option.durationDays,
                  price: option.price,
                  isActive: option.isActive,
                })
                .where(eq(planPricing.id, option.id))

              touchedPricingIds.push(option.id)
              continue
            }

            const matchedByDuration = existingByDuration.get(
              option.durationDays
            )

            if (matchedByDuration) {
              await tx
                .update(planPricing)
                .set({
                  price: option.price,
                  isActive: option.isActive,
                })
                .where(eq(planPricing.id, matchedByDuration.id))

              touchedPricingIds.push(matchedByDuration.id)
              continue
            }

            const [insertedPricing] = await tx
              .insert(planPricing)
              .values({
                planId,
                durationDays: option.durationDays,
                price: option.price,
                isActive: option.isActive,
              })
              .returning({
                id: planPricing.id,
              })

            if (!insertedPricing) {
              throw new Error("Failed to create plan pricing option")
            }

            touchedPricingIds.push(insertedPricing.id)
          }

          const toDisable = existingPricing
            .map((x) => x.id)
            .filter((id) => !touchedPricingIds.includes(id))

          if (toDisable.length > 0) {
            await tx
              .update(planPricing)
              .set({ isActive: false })
              .where(
                and(
                  eq(planPricing.planId, planId),
                  inArray(planPricing.id, toDisable)
                )
              )
          }
        })

        return {
          message: "Plan updated successfully",
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.patch(
    "/admin/plans/:id/status",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const planId = Number(request.params.id)

        if (Number.isNaN(planId)) {
          return reply.status(400).send({ error: "Invalid plan id" })
        }

        const body = updatePlanStatusSchema.parse(request.body)

        const [updated] = await db
          .update(plans)
          .set({
            isActive: body.isActive,
          })
          .where(eq(plans.id, planId))
          .returning({
            id: plans.id,
          })

        if (!updated) {
          return reply.status(404).send({
            error: "Plan not found",
          })
        }

        return reply.send({
          message: body.isActive
            ? "Plan activated successfully"
            : "Plan deactivated successfully",
        })
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

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

        // Allocate server and update instance
        const allocated = await allocateServerToInstance(
          instanceId,
          body.serverId,
          body.username && body.password
            ? {
                username: body.username,
                passwordEncrypted: encryptCredential(body.password),
              }
            : undefined
        )

        // Update instance expiry date and order status (these weren't set during allocation)
        await db.transaction(async (tx) => {
          await tx
            .update(instances)
            .set({
              expiryDate: expiry,
              provisionAttempts: instance.provisionAttempts + 1,
              lastProvisionError: null,
            })
            .where(eq(instances.id, instanceId))

          await tx
            .update(orders)
            .set({
              status: "completed",
            })
            .where(eq(orders.id, linkedOrder.id))
        })

        return {
          message: "Instance provisioned successfully",
          resource: allocated.resource,
          server: allocated.server,
        }
      } catch (err: any) {
        server.log.error(err)
        if (err instanceof AllocationError) {
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

        // Deallocate server and mark resource as released
        await deallocateServer(instanceId)

        // Mark instance as terminated
        await db
          .update(instances)
          .set({
            status: "terminated",
            terminatedAt,
          })
          .where(eq(instances.id, instanceId))

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
    "/admin/transactions",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listAdminTransactions()
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
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
            ipAddress: servers.ipAddress,
            provider: servers.provider,
            resourceStatus: resources.status,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .leftJoin(servers, eq(resources.serverId, servers.id))
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
    "/admin/instances/:id",
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
          .select({
            instance: {
              id: instances.id,
              userId: instances.userId,
              planId: instances.planId,
              status: instances.status,
              startDate: instances.startDate,
              expiryDate: instances.expiryDate,
              terminatedAt: instances.terminatedAt,
              provisionAttempts: instances.provisionAttempts,
              lastProvisionError: instances.lastProvisionError,
              createdAt: instances.createdAt,
              updatedAt: instances.updatedAt,
            },
            plan: {
              id: plans.id,
              name: plans.name,
              cpu: plans.cpu,
              ram: plans.ram,
              storage: plans.storage,
            },
            user: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
            resource: {
              id: resources.id,
              username: resources.username,
              status: resources.status,
              assignedAt: resources.assignedAt,
              releasedAt: resources.releasedAt,
              createdAt: resources.createdAt,
              updatedAt: resources.updatedAt,
            },
            server: {
              id: servers.id,
              provider: servers.provider,
              externalId: servers.externalId,
              ipAddress: servers.ipAddress,
              cpu: servers.cpu,
              ram: servers.ram,
              storage: servers.storage,
              status: servers.status,
              lastAssignedAt: servers.lastAssignedAt,
              createdAt: servers.createdAt,
              updatedAt: servers.updatedAt,
            },
          })
          .from(instances)
          .leftJoin(plans, eq(instances.planId, plans.id))
          .leftJoin(users, eq(instances.userId, users.id))
          .leftJoin(resources, eq(instances.id, resources.instanceId))
          .leftJoin(servers, eq(resources.serverId, servers.id))
          .where(eq(instances.id, instanceId))
          .limit(1)

        if (!result[0]) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        return result[0]
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/servers",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const result = await db
          .select({
            id: servers.id,
            provider: servers.provider,
            externalId: servers.externalId,
            ipAddress: servers.ipAddress,
            cpu: servers.cpu,
            ram: servers.ram,
            storage: servers.storage,
            status: servers.status,
            lastAssignedAt: servers.lastAssignedAt,
            createdAt: servers.createdAt,
            updatedAt: servers.updatedAt,
            activeResourceId: resources.id,
            activeInstanceId: instances.id,
            activeResourceUsername: resources.username,
          })
          .from(servers)
          .leftJoin(
            resources,
            and(
              eq(resources.serverId, servers.id),
              eq(resources.status, "active")
            )
          )
          .leftJoin(instances, eq(resources.instanceId, instances.id))
          .orderBy(asc(servers.id))

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
    "/admin/servers/available",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const availableServers = await db
          .select()
          .from(servers)
          .where(eq(servers.status, "available"))

        return availableServers
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/admin/servers",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = serverInputSchema.parse(request.body)

        const [createdServer] = await db
          .insert(servers)
          .values({
            provider: body.provider,
            externalId: body.externalId ?? null,
            ipAddress: body.ipAddress,
            cpu: body.cpu,
            ram: body.ram,
            storage: body.storage,
            status: body.status,
          })
          .returning({
            id: servers.id,
            provider: servers.provider,
            externalId: servers.externalId,
            ipAddress: servers.ipAddress,
            cpu: servers.cpu,
            ram: servers.ram,
            storage: servers.storage,
            status: servers.status,
            lastAssignedAt: servers.lastAssignedAt,
            createdAt: servers.createdAt,
            updatedAt: servers.updatedAt,
          })

        if (!createdServer) {
          return reply.status(500).send({
            error: "Failed to create server",
          })
        }

        return {
          message: "Server created successfully",
          server: createdServer,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.patch(
    "/admin/servers/:id/status",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const serverId = Number(request.params.id)

        if (Number.isNaN(serverId)) {
          return reply.status(400).send({ error: "Invalid server id" })
        }

        const body = serverStatusUpdateSchema.parse(request.body)

        const [updatedServer] = await db
          .update(servers)
          .set({
            status: body.status,
          })
          .where(eq(servers.id, serverId))
          .returning({
            id: servers.id,
            provider: servers.provider,
            externalId: servers.externalId,
            ipAddress: servers.ipAddress,
            cpu: servers.cpu,
            ram: servers.ram,
            storage: servers.storage,
            status: servers.status,
            lastAssignedAt: servers.lastAssignedAt,
            createdAt: servers.createdAt,
            updatedAt: servers.updatedAt,
          })

        if (!updatedServer) {
          return reply.status(404).send({
            error: "Server not found",
          })
        }

        return {
          message: "Server status updated successfully",
          server: updatedServer,
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
