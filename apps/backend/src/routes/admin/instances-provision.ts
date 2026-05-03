import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import {
  instances,
  orders,
  plans,
  servers,
  users,
} from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { encryptCredential } from "../../services/resource-credentials.js"
import {
  allocateServerToInstance,
  AllocationError,
} from "../../services/allocation.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import { sendProvisionedEmail } from "../../services/email.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  provisionSchema,
  recordInstanceStatusEvent,
} from "./shared.js"

export async function registerAdminInstancesProvisionRoutes(server: FastifyInstance) {
server.post(
  "/admin/instances/:id/provision",
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

      const body = provisionSchema.parse(request.body)

      const instanceResult = await db
        .select()
        .from(instances)
        .where(eq(instances.id, instanceId))
        .limit(1)

      const instance = instanceResult[0]

      if (!instance) {
        return reply.status(404).send({ error: "Instance not found" })
      }

      if (!["pending", "provisioning", "failed"].includes(instance.status)) {
        return reply.status(400).send({
          error: "Instance cannot be provisioned in its current state",
        })
      }

      const linkedOrderResult = await db
        .select({
          id: orders.id,
          durationDays: orders.durationDays,
          status: orders.status,
        })
        .from(orders)
        .where(eq(orders.id, instance.originOrderId))
        .limit(1)

      const linkedOrder = linkedOrderResult[0]

      if (!linkedOrder) {
        return reply.status(400).send({
          error: "Instance is missing its originating order",
        })
      }

      const now = new Date()
      const expiry = new Date(now)
      expiry.setDate(expiry.getDate() + linkedOrder.durationDays)
      const [serverBeforeAllocation] = await db
        .select({
          id: servers.id,
          status: servers.status,
        })
        .from(servers)
        .where(eq(servers.id, body.serverId))
        .limit(1)

      // Older paid instances may still be marked pending or failed.
      // Move them into provisioning before allocation so the allocator
      // can enforce the spec's "provisioning -> active" transition.
      if (instance.status !== "provisioning") {
        await db
          .update(instances)
          .set({
            status: "provisioning",
          })
          .where(eq(instances.id, instanceId))
      }

      // Allocate server and update instance
      const allocated = await allocateServerToInstance(
        instanceId,
        body.serverId,
        body.username && body.password
          ? {
              username: body.username,
              passwordEncrypted: encryptCredential(body.password),
            }
          : undefined
      )

      // Update instance expiry date and order status (these weren't set during allocation)
      await db.transaction(async (tx) => {
        await tx
          .update(instances)
          .set({
            expiryDate: expiry,
            provisionAttempts: instance.provisionAttempts + 1,
            lastProvisionError: null,
          })
          .where(eq(instances.id, instanceId))

        await tx
          .update(orders)
          .set({
            status: "completed",
          })
          .where(eq(orders.id, linkedOrder.id))
      })

      await recordInstanceStatusEvent({
        instanceId,
        adminUserId: request.user!.userId,
        action: "provision",
        reason: body.reason ?? "Admin provisioned instance",
        fromStatus: instance.status,
        toStatus: "active",
      })

      if (
        serverBeforeAllocation &&
        serverBeforeAllocation.status !== allocated.server.status
      ) {
        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "server.status_change",
          entityType: "server",
          entityId: allocated.server.id,
          reason:
            body.reason ??
            `Server assigned during provisioning for instance #${instanceId}`,
          beforeState: {
            status: serverBeforeAllocation.status,
          },
          afterState: {
            status: allocated.server.status,
          },
          metadata: {
            instanceId,
          },
        })
      }

      const [instanceOwner] = await db
        .select({
          email: users.email,
          firstName: users.firstName,
          planName: plans.name,
        })
        .from(instances)
        .innerJoin(users, eq(instances.userId, users.id))
        .innerJoin(plans, eq(instances.planId, plans.id))
        .where(eq(instances.id, instanceId))
        .limit(1)

      if (instanceOwner) {
        void sendProvisionedEmail({
          to: instanceOwner.email,
          firstName: instanceOwner.firstName,
          instanceId,
          planName: instanceOwner.planName,
          ipAddress: allocated.server.ipAddress,
          username: allocated.resource.username ?? null,
        }).catch((emailError) => {
          server.log.error(emailError)
        })
      }

      return {
        message: "Instance provisioned successfully",
        resource: allocated.resource,
        server: allocated.server,
      }
    } catch (err: unknown) {
      server.log.error(err)
      if (err instanceof AllocationError) {
        return reply.status(err.statusCode).send({
          error: err.message,
        })
      }
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  }
)

}
