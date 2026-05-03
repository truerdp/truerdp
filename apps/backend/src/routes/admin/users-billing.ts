import { FastifyInstance } from "fastify"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  listAdminInvoices,
  listAdminTransactions,
  listPendingTransactions,
  sendExpiryReminderSweep,
} from "../../services/billing.js"
import { getAdminUser360, listAdminUsers } from "../../services/admin-user.js"
import { createAdminAuditLog, listAdminAuditLogs } from "../../services/admin-audit.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  adminQuerySchemas,
} from "./shared.js"

const {
  adminListPaginationQuerySchema,
  adminAuditLogQuerySchema,
  expiryReminderRunSchema,
  adminInvoiceListQuerySchema,
} = adminQuerySchemas

export async function registerAdminUsersBillingRoutes(server: FastifyInstance) {
server.get(
  "/admin/users",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      return await listAdminUsers()
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
    try {
      const userId = Number((request.params as Record<string, unknown>).id)

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
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const query = adminInvoiceListQuerySchema.parse(request.query ?? {})

      return await listAdminInvoices(query)
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const query = adminListPaginationQuerySchema.parse(request.query ?? {})

      return await listAdminTransactions(query)
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      return await listPendingTransactions()
    } catch (err: unknown) {
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
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const query = adminAuditLogQuerySchema.parse(request.query ?? {})
      return await listAdminAuditLogs(query)
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

server.post(
  "/admin/notifications/expiry-reminders/run",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      if (!requireAdmin(request.user, reply)) {
        return
      }

      const body = expiryReminderRunSchema.parse(request.body ?? {})
      const result = await sendExpiryReminderSweep({
        daysAhead: body.daysAhead,
      })

      await createAdminAuditLog({
        adminUserId: request.user!.userId,
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
    } catch (err: unknown) {
      server.log.error(err)
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
  )
}
