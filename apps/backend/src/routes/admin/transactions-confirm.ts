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

export async function registerAdminTransactionsConfirmRoutes(server: FastifyInstance) {
server.post(
  "/admin/transactions/:id/confirm",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const transactionId = Number((request.params as Record<string, unknown>).id)
      const body = optionalReasonSchema.parse(request.body ?? {})

      if (!requireAdmin(request.user, reply)) {
        return
      }

      if (Number.isNaN(transactionId)) {
        return reply.status(400).send({ error: "Invalid transaction id" })
      }

      return await confirmPendingTransaction(transactionId, {
        adminUserId: request.user!.userId,
        reason: body.reason,
        source: "admin",
      })
    } catch (err: unknown) {
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
}
