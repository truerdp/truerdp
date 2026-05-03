import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { instanceExtensions, instances } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  extendInstanceSchema,
  recordInstanceStatusEvent,
} from "./shared.js"

export async function registerAdminInstancesExtendRoutes(server: FastifyInstance) {
server.post(
  "/admin/instances/:id/extend",
  { preHandler: verifyAuth },
  async (request: GenericRouteRequest, reply) => {
    try {
      const instanceId = Number((request.params as Record<string, unknown>).id)
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
          extendedByUserId: request.user!.userId,
          previousExpiryDate,
          newExpiryDate,
          daysExtended: body.days,
        })
      })

      await recordInstanceStatusEvent({
        instanceId,
        adminUserId: request.user!.userId,
        action: "extend",
        reason: `Admin extended instance by ${body.days} days`,
        fromStatus: instance.status,
        toStatus: instance.status,
      })

      return {
        message: "Instance extended successfully",
        newExpiryDate,
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
