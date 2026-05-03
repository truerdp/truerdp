import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { instances } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  getEffectiveRestoreStatus,
  reasonSchema,
  recordInstanceStatusEvent,
} from "./shared.js"

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
