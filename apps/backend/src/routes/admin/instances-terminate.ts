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

export async function registerAdminInstancesTerminateRoutes(server: FastifyInstance) {
server.post(
  "/admin/instances/:id/terminate",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const instanceId = Number((request.params as Record<string, unknown>).id)
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
        adminUserId: request.user!.userId,
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
          adminUserId: request.user!.userId,
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
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(500).send({
        error: "Internal server error",
      })
    }
  }
)
}
