import { FastifyInstance } from "fastify"
import { and, asc, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm"
import { db } from "../../db.js"
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
} from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  BillingError,
  listAdminInvoices,
  confirmPendingTransaction,
  listAdminTransactions,
  listPendingTransactions,
  sendExpiryReminderSweep,
} from "../../services/billing.js"
import { getAdminUser360, listAdminUsers } from "../../services/admin-user.js"
import { syncDodoProductForPlanPricing } from "../../services/dodo-payments.js"
import { encryptCredential } from "../../services/resource-credentials.js"
import { listAdminPlansWithPricing } from "../../services/plan.js"
import {
  allocateServerToInstance,
  AllocationError,
  deallocateServer,
} from "../../services/allocation.js"
import { createAdminAuditLog, listAdminAuditLogs } from "../../services/admin-audit.js"
import { sendProvisionedEmail } from "../../services/email.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  adminQuerySchemas,
  couponInputSchema,
  couponStatusSchema,
  createPlanSchema,
  extendInstanceSchema,
  getEffectiveRestoreStatus,
  optionalReasonSchema,
  provisionSchema,
  reasonSchema,
  recordInstanceStatusEvent,
  serverInputSchema,
  serverStatusUpdateSchema,
  syncCouponToDodo,
  updatePlanFeaturedSchema,
  updatePlanSchema,
  updatePlanStatusSchema,
} from "./shared.js"

const {
  adminListPaginationQuerySchema,
  adminAuditLogQuerySchema,
  expiryReminderRunSchema,
  adminInvoiceListQuerySchema,
} = adminQuerySchemas

export async function registerAdminPlansListCreateRoutes(server: FastifyInstance) {
server.get(
  "/admin/plans",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      return await listAdminPlansWithPricing()
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
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
            isFeatured: body.isFeatured,
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
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)
}
