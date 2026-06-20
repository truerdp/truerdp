import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "../../db.js"
import { verifyAuth } from "../../middleware/auth.js"
import {
  createImpersonationSession,
  getImpersonationCookieOptions,
  IMPERSONATION_COOKIE_NAME,
  type ImpersonationMode,
} from "../../services/impersonation.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import {
  customerPermissions,
  userHasPermission,
} from "../../services/permissions.js"
import { users } from "../../schema.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"

const startImpersonationBodySchema = z.object({
  reason: z.string().trim().min(1, "Reason for access is required"),
  mode: z.enum(["full"]).default("full"),
})

export async function registerAdminImpersonationRoutes(
  server: FastifyInstance
) {
  server.post(
    "/admin/users/:id/impersonations",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Admin"],
        summary: "Start customer impersonation",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        body: {
          type: "object",
          required: ["reason", "mode"],
          properties: {
            reason: { type: "string", minLength: 1 },
            mode: { type: "string", enum: ["full"] },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const adminUser = request.realUser ?? request.user

        if (!userHasPermission(adminUser, customerPermissions.impersonate)) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (request.impersonation) {
          return reply.status(409).send({
            error:
              "End the active impersonation session before starting another.",
          })
        }

        const targetUserId = Number(
          (request.params as Record<string, unknown>).id
        )

        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
          return reply.status(400).send({ error: "Invalid user id" })
        }

        if (targetUserId === adminUser!.userId) {
          return reply.status(400).send({
            error: "Administrators cannot impersonate their own account.",
          })
        }

        const body = startImpersonationBodySchema.parse(request.body ?? {})
        const [targetUser] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, targetUserId))
          .limit(1)

        if (!targetUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        if (targetUser.role !== "user") {
          return reply.status(400).send({
            error: "Only customer accounts can be impersonated.",
          })
        }

        const session = await createImpersonationSession({
          adminUserId: adminUser!.userId,
          targetUserId,
          mode: body.mode as ImpersonationMode,
          reason: body.reason,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? null,
        })

        reply.setCookie(
          IMPERSONATION_COOKIE_NAME,
          session.token,
          getImpersonationCookieOptions(session.expiresAt)
        )

        await createAdminAuditLog({
          adminUserId: adminUser!.userId,
          action: "customer.impersonation.start",
          entityType: "user",
          entityId: targetUserId,
          reason: body.reason,
          metadata: {
            impersonationSessionId: session.id,
            mode: session.mode,
            expiresAt: session.expiresAt.toISOString(),
            permission: customerPermissions.impersonate,
          },
        })

        return reply.status(201).send({
          message: "Impersonation started",
          redirectTo: "/",
          session: {
            id: session.id,
            mode: session.mode,
            startedAt: session.startedAt,
            expiresAt: session.expiresAt,
            customer: targetUser,
          },
        })
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({ error: getErrorMessage(err) })
      }
    }
  )
}
