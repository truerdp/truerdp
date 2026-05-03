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

export async function registerAdminPlansFlagsRoutes(server: FastifyInstance) {
server.patch(
  "/admin/plans/:id/status",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const planId = Number((request.params as Record<string, unknown>).id)

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
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

server.patch(
  "/admin/plans/:id/featured",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const planId = Number((request.params as Record<string, unknown>).id)

      if (Number.isNaN(planId)) {
        return reply.status(400).send({ error: "Invalid plan id" })
      }

      const body = updatePlanFeaturedSchema.parse(request.body)

      const [updated] = await db
        .update(plans)
        .set({
          isFeatured: body.isFeatured,
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
        message: body.isFeatured
          ? "Plan added to featured plans"
          : "Plan removed from featured plans",
      })
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)
}
