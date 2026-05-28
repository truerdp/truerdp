import { FastifyInstance } from "fastify"

import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import {
  listPaymentWebhookEvents,
  reprocessPaymentWebhookEvent,
} from "../../services/payment-webhooks.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import { adminQuerySchemas } from "./shared.js"

const { adminWebhookEventListQuerySchema } = adminQuerySchemas

export async function registerAdminWebhookEventRoutes(server: FastifyInstance) {
  server.get(
    "/admin/webhook-events",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminWebhookEventListQuerySchema.parse(
          request.query ?? {}
        )
        return await listPaymentWebhookEvents(query)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.post(
    "/admin/webhook-events/:id/reprocess",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const eventRowId = Number(
          (request.params as Record<string, unknown>).id
        )

        if (Number.isNaN(eventRowId)) {
          return reply.status(400).send({ error: "Invalid webhook event id" })
        }

        const result = await reprocessPaymentWebhookEvent(eventRowId)

        if (!result) {
          return reply.status(404).send({ error: "Webhook event not found" })
        }

        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "webhook.reprocess",
          entityType: "payment_webhook_event",
          entityId: eventRowId,
          reason: "Admin reprocessed payment webhook event",
          beforeState: null,
          afterState: result,
        })

        return {
          message: "Webhook event reprocessed",
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
