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

export async function registerAdminInstancesSuspendUnsuspendRoutes(server: FastifyInstance) {
server.post(
  "/admin/instances/:id/suspend",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const instanceId = Number((request.params as Record<string, unknown>).id)

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
        adminUserId: request.user!.userId,
        action: "suspend",
        reason: body.reason,
        fromStatus: instance.status,
        toStatus: "suspended",
      })

      return { message: "Instance suspended successfully" }
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

server.post(
  "/admin/instances/:id/unsuspend",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const instanceId = Number((request.params as Record<string, unknown>).id)

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
        adminUserId: request.user!.userId,
        action: "unsuspend",
        reason: body.reason,
        fromStatus: "suspended",
        toStatus: restoreStatus,
      })

      return {
        message: "Instance suspension undone successfully",
        status: restoreStatus,
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
