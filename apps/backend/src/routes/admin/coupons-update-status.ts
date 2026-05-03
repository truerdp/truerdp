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

export async function registerAdminCouponsUpdateStatusRoutes(server: FastifyInstance) {
server.put(
  "/admin/coupons/:id",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const couponId = Number((request.params as Record<string, unknown>).id)

      if (Number.isNaN(couponId)) {
        return reply.status(400).send({ error: "Invalid coupon id" })
      }

      const body = couponInputSchema.parse(request.body ?? {})
      const updated = await db.transaction(async (tx) => {
        const [coupon] = await tx
          .update(coupons)
          .set({
            code: body.code.trim().toUpperCase(),
            type: body.type,
            value: body.value,
            appliesTo: body.appliesTo,
            maxUses: body.maxUses ?? null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!coupon) {
          return null
        }

        await syncCouponToDodo(tx, coupon)

        const [synced] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, coupon.id))
          .limit(1)

        return synced ?? coupon
      })

      if (!updated) {
        return reply.status(404).send({ error: "Coupon not found" })
      }

      return {
        message: "Coupon updated successfully",
        coupon: updated,
      }
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

server.patch(
  "/admin/coupons/:id/status",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const couponId = Number((request.params as Record<string, unknown>).id)

      if (Number.isNaN(couponId)) {
        return reply.status(400).send({ error: "Invalid coupon id" })
      }

      const body = couponStatusSchema.parse(request.body ?? {})
      const updated = await db.transaction(async (tx) => {
        const [coupon] = await tx
          .update(coupons)
          .set({
            isActive: body.isActive,
            dodoSyncStatus: "pending",
            dodoSyncError: null,
          })
          .where(eq(coupons.id, couponId))
          .returning()

        if (!coupon) {
          return null
        }

        await syncCouponToDodo(tx, coupon)

        const [synced] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.id, coupon.id))
          .limit(1)

        return synced ?? coupon
      })

      if (!updated) {
        return reply.status(404).send({ error: "Coupon not found" })
      }

      return {
        message: body.isActive
          ? "Coupon activated successfully"
          : "Coupon deactivated successfully",
        coupon: updated,
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
