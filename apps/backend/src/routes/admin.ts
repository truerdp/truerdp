import { FastifyInstance } from "fastify"
import { and, asc, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import {
  coupons,
  couponUsages,
  instanceExtensions,
  instanceStatusEvents,
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
  listAdminInvoices,
  confirmPendingTransaction,
  listAdminTransactions,
  listPendingTransactions,
  sendExpiryReminderSweep,
} from "../services/billing.js"
import { getAdminUser360, listAdminUsers } from "../services/admin-user.js"
import { syncDodoProductForPlanPricing } from "../services/dodo-payments.js"
import { encryptCredential } from "../services/resource-credentials.js"
import { listAdminPlansWithPricing } from "../services/plan.js"
import {
  allocateServerToInstance,
  AllocationError,
  deallocateServer,
} from "../services/allocation.js"
import { createAdminAuditLog, listAdminAuditLogs } from "../services/admin-audit.js"
import { sendProvisionedEmail } from "../services/email.js"

const provisionSchema = z.object({
  serverId: z.number().int().positive(),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1).optional(),
  reason: z.string().trim().min(3).max(500).optional(),
})

const extendInstanceSchema = z.object({
  days: z.number().int().positive(),
})

const reasonSchema = z.object({
  reason: z.string().trim().min(3).max(500),
})

const optionalReasonSchema = z.object({
  reason: z.string().trim().min(3).max(500).optional(),
})

const planPricingInputSchema = z.object({
  id: z.number().int().positive().optional(),
  durationDays: z.number().int().positive(),
  priceUsdCents: z.number().int().nonnegative(),
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
  reason: z.string().trim().min(3).max(500).optional(),
})

const couponInputSchema = z
  .object({
    code: z.string().trim().min(1).max(64),
    type: z.enum(["percent", "flat"]),
    value: z.number().int().positive(),
    appliesTo: z.enum(["all", "new_purchase", "renewal"]).default("all"),
    maxUses: z.number().int().positive().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.type !== "percent" || value.value <= 100, {
    message: "Percent coupon value must be 1-100",
    path: ["value"],
  })

const couponStatusSchema = z.object({
  isActive: z.boolean(),
})

const adminListPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const adminAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  entityId: z.coerce.number().int().positive().optional(),
  adminUserId: z.coerce.number().int().positive().optional(),
})

const expiryReminderRunSchema = z.object({
  daysAhead: z.number().int().min(1).max(30).optional(),
})

const adminInvoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  invoiceStatus: z.enum(["unpaid", "paid", "expired"]).optional(),
  transactionStatus: z
    .enum(["none", "pending", "confirmed", "failed"])
    .optional(),
  method: z
    .enum(["none", "upi", "usdt_trc20", "dodo_checkout", "coingate_checkout"])
    .optional(),
})

function requireAdmin(user: any, reply: any) {
  if (user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}

function getEffectiveRestoreStatus(expiryDate: Date | null) {
  return expiryDate && expiryDate < new Date() ? "expired" : "active"
}

async function recordInstanceStatusEvent(input: {
  instanceId: number
  adminUserId: number
  action: "provision" | "extend" | "suspend" | "unsuspend" | "terminate"
  reason: string
  fromStatus: typeof instances.$inferSelect.status
  toStatus: typeof instances.$inferSelect.status
}) {
  await db.insert(instanceStatusEvents).values(input)
  await createAdminAuditLog({
    adminUserId: input.adminUserId,
    action: `instance.${input.action}`,
    entityType: "instance",
    entityId: input.instanceId,
    reason: input.reason,
    beforeState: {
      status: input.fromStatus,
    },
    afterState: {
      status: input.toStatus,
    },
  })
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

          await tx
            .insert(planPricing)
            .values(
              body.pricingOptions.map((option) => ({
                planId: plan.id,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                isActive: option.isActive,
              }))
            )
            .returning({
              id: planPricing.id,
              durationDays: planPricing.durationDays,
              priceUsdCents: planPricing.priceUsdCents,
              dodoProductId: planPricing.dodoProductId,
            })

          const insertedPricing = await tx
            .select({
              id: planPricing.id,
              durationDays: planPricing.durationDays,
              priceUsdCents: planPricing.priceUsdCents,
              dodoProductId: planPricing.dodoProductId,
            })
            .from(planPricing)
            .where(eq(planPricing.planId, plan.id))

          for (const pricing of insertedPricing) {
            const syncResult = await syncDodoProductForPlanPricing({
              planPricingId: pricing.id,
              planName: body.name,
              durationDays: pricing.durationDays,
              priceUsdCents: pricing.priceUsdCents,
              existingDodoProductId: pricing.dodoProductId,
            })

            await tx
              .update(planPricing)
              .set({
                dodoProductId: syncResult.dodoProductId,
                dodoSyncStatus: "synced",
                dodoSyncError: null,
                dodoSyncedAt: syncResult.syncedAt,
              })
              .where(eq(planPricing.id, pricing.id))
          }

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
              dodoProductId: planPricing.dodoProductId,
            })
            .from(planPricing)
            .where(eq(planPricing.planId, planId))

          const existingById = new Map(existingPricing.map((x) => [x.id, x]))
          const existingByDuration = new Map(
            existingPricing.map((x) => [x.durationDays, x])
          )
          const touchedPricingIds: number[] = []
          const syncTargets: Array<{
            id: number
            durationDays: number
            priceUsdCents: number
            dodoProductId: string | null
          }> = []

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
                  priceUsdCents: option.priceUsdCents,
                  isActive: option.isActive,
                })
                .where(eq(planPricing.id, option.id))

              touchedPricingIds.push(option.id)
              syncTargets.push({
                id: option.id,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                dodoProductId: matchedById.dodoProductId,
              })
              continue
            }

            const matchedByDuration = existingByDuration.get(
              option.durationDays
            )

            if (matchedByDuration) {
              await tx
                .update(planPricing)
                .set({
                  priceUsdCents: option.priceUsdCents,
                  isActive: option.isActive,
                })
                .where(eq(planPricing.id, matchedByDuration.id))

              touchedPricingIds.push(matchedByDuration.id)
              syncTargets.push({
                id: matchedByDuration.id,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                dodoProductId: matchedByDuration.dodoProductId,
              })
              continue
            }

            const [insertedPricing] = await tx
              .insert(planPricing)
              .values({
                planId,
                durationDays: option.durationDays,
                priceUsdCents: option.priceUsdCents,
                isActive: option.isActive,
              })
              .returning({
                id: planPricing.id,
              })

            if (!insertedPricing) {
              throw new Error("Failed to create plan pricing option")
            }

            touchedPricingIds.push(insertedPricing.id)
            syncTargets.push({
              id: insertedPricing.id,
              durationDays: option.durationDays,
              priceUsdCents: option.priceUsdCents,
              dodoProductId: null,
            })
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

          for (const pricing of syncTargets) {
            const syncResult = await syncDodoProductForPlanPricing({
              planPricingId: pricing.id,
              planName: body.name,
              durationDays: pricing.durationDays,
              priceUsdCents: pricing.priceUsdCents,
              existingDodoProductId: pricing.dodoProductId,
            })

            await tx
              .update(planPricing)
              .set({
                dodoProductId: syncResult.dodoProductId,
                dodoSyncStatus: "synced",
                dodoSyncError: null,
                dodoSyncedAt: syncResult.syncedAt,
              })
              .where(eq(planPricing.id, pricing.id))
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

  server.get(
    "/admin/coupons",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db
          .select({
            id: coupons.id,
            code: coupons.code,
            type: coupons.type,
            value: coupons.value,
            appliesTo: coupons.appliesTo,
            maxUses: coupons.maxUses,
            expiresAt: coupons.expiresAt,
            isActive: coupons.isActive,
            createdAt: coupons.createdAt,
            updatedAt: coupons.updatedAt,
            usageCount: sql<number>`(
              select count(*)::int
              from ${couponUsages} cu
              where cu.coupon_id = ${coupons.id}
            )`,
          })
          .from(coupons)
          .orderBy(desc(coupons.createdAt))
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.post(
    "/admin/coupons",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = couponInputSchema.parse(request.body ?? {})

        const [created] = await db
          .insert(coupons)
          .values({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
          })
          .returning()

        return {
          message: "Coupon created successfully",
          coupon: created,
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
    "/admin/coupons/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const couponId = Number(request.params.id)

        if (Number.isNaN(couponId)) {
          return reply.status(400).send({ error: "Invalid coupon id" })
        }

        const body = couponInputSchema.parse(request.body ?? {})
        const [updated] = await db
          .update(coupons)
          .set({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!updated) {
          return reply.status(404).send({ error: "Coupon not found" })
        }

        return {
          message: "Coupon updated successfully",
          coupon: updated,
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
    "/admin/coupons/:id/status",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const couponId = Number(request.params.id)

        if (Number.isNaN(couponId)) {
          return reply.status(400).send({ error: "Invalid coupon id" })
        }

        const body = couponStatusSchema.parse(request.body ?? {})
        const [updated] = await db
          .update(coupons)
          .set({ isActive: body.isActive })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!updated) {
          return reply.status(404).send({ error: "Coupon not found" })
        }

        return {
          message: body.isActive
            ? "Coupon activated successfully"
            : "Coupon deactivated successfully",
          coupon: updated,
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
    "/admin/transactions/:id/confirm",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const transactionId = Number(request.params.id)
        const body = optionalReasonSchema.parse(request.body ?? {})

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(transactionId)) {
          return reply.status(400).send({ error: "Invalid transaction id" })
        }

        return await confirmPendingTransaction(transactionId, {
          adminUserId: request.user.userId,
          reason: body.reason,
          source: "admin",
        })
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
        const [serverBeforeAllocation] = await db
          .select({
            id: servers.id,
            status: servers.status,
          })
          .from(servers)
          .where(eq(servers.id, body.serverId))
          .limit(1)

        // Older paid instances may still be marked pending or failed.
        // Move them into provisioning before allocation so the allocator
        // can enforce the spec's "provisioning -> active" transition.
        if (instance.status !== "provisioning") {
          await db
            .update(instances)
            .set({
              status: "provisioning",
            })
            .where(eq(instances.id, instanceId))
        }

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

        await recordInstanceStatusEvent({
          instanceId,
          adminUserId: request.user.userId,
          action: "provision",
          reason: body.reason ?? "Admin provisioned instance",
          fromStatus: instance.status,
          toStatus: "active",
        })

        if (
          serverBeforeAllocation &&
          serverBeforeAllocation.status !== allocated.server.status
        ) {
          await createAdminAuditLog({
            adminUserId: request.user.userId,
            action: "server.status_change",
            entityType: "server",
            entityId: allocated.server.id,
            reason:
              body.reason ??
              `Server assigned during provisioning for instance #${instanceId}`,
            beforeState: {
              status: serverBeforeAllocation.status,
            },
            afterState: {
              status: allocated.server.status,
            },
            metadata: {
              instanceId,
            },
          })
        }

        const [instanceOwner] = await db
          .select({
            email: users.email,
            firstName: users.firstName,
            planName: plans.name,
          })
          .from(instances)
          .innerJoin(users, eq(instances.userId, users.id))
          .innerJoin(plans, eq(instances.planId, plans.id))
          .where(eq(instances.id, instanceId))
          .limit(1)

        if (instanceOwner) {
          void sendProvisionedEmail({
            to: instanceOwner.email,
            firstName: instanceOwner.firstName,
            instanceId,
            planName: instanceOwner.planName,
            ipAddress: allocated.server.ipAddress,
            username: allocated.resource.username ?? null,
          }).catch((emailError) => {
            server.log.error(emailError)
          })
        }

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
        const body = optionalReasonSchema.parse(request.body ?? {})

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

        const [activeServerBeforeTermination] = await db
          .select({
            serverId: servers.id,
            status: servers.status,
          })
          .from(resources)
          .innerJoin(servers, eq(resources.serverId, servers.id))
          .where(
            and(
              eq(resources.instanceId, instanceId),
              eq(resources.status, "active")
            )
          )
          .limit(1)

        // Deallocate server and mark resource as released
        const deallocated = await deallocateServer(instanceId)

        // Mark instance as terminated
        await db
          .update(instances)
          .set({
            status: "terminated",
            terminatedAt,
          })
          .where(eq(instances.id, instanceId))

        await recordInstanceStatusEvent({
          instanceId,
          adminUserId: request.user.userId,
          action: "terminate",
          reason: body.reason ?? "Admin terminated instance",
          fromStatus: instance.status,
          toStatus: "terminated",
        })

        if (deallocated?.serverId && activeServerBeforeTermination) {
          const [serverAfterTermination] = await db
            .select({
              status: servers.status,
            })
            .from(servers)
            .where(eq(servers.id, deallocated.serverId))
            .limit(1)

          await createAdminAuditLog({
            adminUserId: request.user.userId,
            action: "server.status_change",
            entityType: "server",
            entityId: deallocated.serverId,
            reason: body.reason ?? "Server moved to cleaning after termination",
            beforeState: {
              status: activeServerBeforeTermination.status,
            },
            afterState: {
              status: serverAfterTermination?.status ?? "cleaning",
            },
            metadata: {
              instanceId,
            },
          })
        }

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
    "/admin/instances/:id/suspend",
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

        const body = reasonSchema.parse(request.body ?? {})
        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.status === "suspended") {
          return reply.status(400).send({ error: "Instance already suspended" })
        }

        if (
          !["active", "provisioning", "expired"].includes(instance.status)
        ) {
          return reply.status(400).send({
            error: "Instance cannot be suspended in its current state",
          })
        }

        await db
          .update(instances)
          .set({ status: "suspended" })
          .where(eq(instances.id, instanceId))

        await recordInstanceStatusEvent({
          instanceId,
          adminUserId: request.user.userId,
          action: "suspend",
          reason: body.reason,
          fromStatus: instance.status,
          toStatus: "suspended",
        })

        return { message: "Instance suspended successfully" }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.post(
    "/admin/instances/:id/unsuspend",
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

        const body = reasonSchema.parse(request.body ?? {})
        const result = await db
          .select()
          .from(instances)
          .where(eq(instances.id, instanceId))
          .limit(1)

        const instance = result[0]

        if (!instance) {
          return reply.status(404).send({ error: "Instance not found" })
        }

        if (instance.status !== "suspended") {
          return reply.status(400).send({ error: "Instance is not suspended" })
        }

        const restoreStatus = getEffectiveRestoreStatus(instance.expiryDate)

        await db
          .update(instances)
          .set({ status: restoreStatus })
          .where(eq(instances.id, instanceId))

        await recordInstanceStatusEvent({
          instanceId,
          adminUserId: request.user.userId,
          action: "unsuspend",
          reason: body.reason,
          fromStatus: "suspended",
          toStatus: restoreStatus,
        })

        return {
          message: "Instance suspension undone successfully",
          status: restoreStatus,
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

        const previousExpiryDate = instance.expiryDate

        const newExpiryDate = new Date(previousExpiryDate)
        newExpiryDate.setDate(newExpiryDate.getDate() + body.days)

        await db.transaction(async (tx) => {
          await tx
            .update(instances)
            .set({
              expiryDate: newExpiryDate,
            })
            .where(eq(instances.id, instance.id))

          await tx.insert(instanceExtensions).values({
            instanceId: instance.id,
            extendedByUserId: request.user.userId,
            previousExpiryDate,
            newExpiryDate,
            daysExtended: body.days,
          })
        })

        await recordInstanceStatusEvent({
          instanceId,
          adminUserId: request.user.userId,
          action: "extend",
          reason: `Admin extended instance by ${body.days} days`,
          fromStatus: instance.status,
          toStatus: instance.status,
        })

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
    "/admin/users",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listAdminUsers()
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/users/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = Number(request.params.id)

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(userId)) {
          return reply.status(400).send({ error: "Invalid user id" })
        }

        const user360 = await getAdminUser360(userId)

        if (!user360) {
          return reply.status(404).send({ error: "User not found" })
        }

        return user360
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/invoices",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminInvoiceListQuerySchema.parse(request.query ?? {})

        return await listAdminInvoices(query)
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
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

        const query = adminListPaginationQuerySchema.parse(request.query ?? {})

        return await listAdminTransactions(query)
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
    "/admin/audit-logs",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminAuditLogQuerySchema.parse(request.query ?? {})
        return await listAdminAuditLogs(query)
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.post(
    "/admin/notifications/expiry-reminders/run",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = expiryReminderRunSchema.parse(request.body ?? {})
        const result = await sendExpiryReminderSweep({
          daysAhead: body.daysAhead,
        })

        await createAdminAuditLog({
          adminUserId: request.user.userId,
          action: "notification.expiry_reminder.run",
          entityType: "system",
          entityId: null,
          reason: "Admin triggered expiry reminder run",
          beforeState: null,
          afterState: {
            sent: result.sent,
            checked: result.checked,
          },
          metadata: {
            daysAhead: result.daysAhead,
          },
        })

        return {
          message: "Expiry reminder sweep completed",
          ...result,
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
              ne(instances.status, "suspended"),
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

        const query = adminListPaginationQuerySchema.parse(request.query ?? {})

        const countResult = await db
          .select({ totalCount: sql<number>`count(*)::int` })
          .from(instances)

        const totalCount = countResult[0]?.totalCount ?? 0
        const totalPages = Math.ceil(totalCount / query.pageSize)
        const page = totalPages > 0 ? Math.min(query.page, totalPages) : 1
        const offset = (page - 1) * query.pageSize

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
            extensionCount: sql<number>`(
              select count(*)::int
              from ${instanceExtensions} ie
              where ie.instance_id = ${instances.id}
            )`,
            lastExtensionAt: sql<string | null>`(
              select ie.created_at::text
              from ${instanceExtensions} ie
              where ie.instance_id = ${instances.id}
              order by ie.created_at desc
              limit 1
            )`,
            lastExtensionDays: sql<number | null>`(
              select ie.days_extended
              from ${instanceExtensions} ie
              where ie.instance_id = ${instances.id}
              order by ie.created_at desc
              limit 1
            )`,
          })
          .from(instances)
          .leftJoin(resources, eq(resources.instanceId, instances.id))
          .leftJoin(servers, eq(resources.serverId, servers.id))
          .orderBy(desc(instances.createdAt))
          .limit(query.pageSize)
          .offset(offset)

        return {
          items: result,
          pagination: {
            page,
            pageSize: query.pageSize,
            totalCount,
            totalPages,
          },
        }
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

        const extensionHistory = await db
          .select({
            id: instanceExtensions.id,
            previousExpiryDate: instanceExtensions.previousExpiryDate,
            newExpiryDate: instanceExtensions.newExpiryDate,
            daysExtended: instanceExtensions.daysExtended,
            createdAt: instanceExtensions.createdAt,
            extendedBy: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(instanceExtensions)
          .leftJoin(users, eq(instanceExtensions.extendedByUserId, users.id))
          .where(eq(instanceExtensions.instanceId, instanceId))
          .orderBy(desc(instanceExtensions.createdAt))

        const statusEvents = await db
          .select({
            id: instanceStatusEvents.id,
            action: instanceStatusEvents.action,
            reason: instanceStatusEvents.reason,
            fromStatus: instanceStatusEvents.fromStatus,
            toStatus: instanceStatusEvents.toStatus,
            createdAt: instanceStatusEvents.createdAt,
            admin: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(instanceStatusEvents)
          .leftJoin(users, eq(instanceStatusEvents.adminUserId, users.id))
          .where(eq(instanceStatusEvents.instanceId, instanceId))
          .orderBy(desc(instanceStatusEvents.createdAt))

        return {
          ...result[0],
          extensionHistory,
          statusEvents,
        }
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
        const [currentServer] = await db
          .select({
            id: servers.id,
            status: servers.status,
          })
          .from(servers)
          .where(eq(servers.id, serverId))
          .limit(1)

        if (!currentServer) {
          return reply.status(404).send({
            error: "Server not found",
          })
        }

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
          return reply.status(500).send({
            error: "Failed to update server status",
          })
        }

        await createAdminAuditLog({
          adminUserId: request.user.userId,
          action: "server.status_change",
          entityType: "server",
          entityId: updatedServer.id,
          reason:
            body.reason ??
            `Admin changed server status from ${currentServer.status} to ${updatedServer.status}`,
          beforeState: {
            status: currentServer.status,
          },
          afterState: {
            status: updatedServer.status,
          },
        })

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
