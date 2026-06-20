import { FastifyInstance } from "fastify"

import { verifyAuth } from "../middleware/auth.js"
import {
  endImpersonationSession,
  getImpersonationCookieOptions,
  IMPERSONATION_COOKIE_NAME,
  IMPERSONATION_EXPIRY_WARNING_MS,
} from "../services/impersonation.js"
import { createAdminAuditLog } from "../services/admin-audit.js"
import type { GenericRouteRequest } from "../types/requests.js"

function serializeContext(request: GenericRouteRequest) {
  const context = request.impersonation

  if (!context) {
    return { active: false }
  }

  const now = Date.now()
  const expiresAt = context.expiresAt.getTime()

  return {
    active: true,
    sessionId: context.sessionId,
    mode: context.mode,
    reason: context.reason,
    startedAt: context.startedAt.toISOString(),
    expiresAt: context.expiresAt.toISOString(),
    secondsRemaining: Math.max(0, Math.floor((expiresAt - now) / 1000)),
    expiresSoon: expiresAt - now <= IMPERSONATION_EXPIRY_WARNING_MS,
    admin: {
      id: context.admin.id,
      email: context.admin.email,
      firstName: context.admin.firstName,
      lastName: context.admin.lastName,
    },
    customer: {
      id: context.target.id,
      email: context.target.email,
      firstName: context.target.firstName,
      lastName: context.target.lastName,
    },
  }
}

export async function impersonationRoutes(server: FastifyInstance) {
  server.get(
    "/impersonation/current",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["User"],
        summary: "Get active impersonation context",
      },
    },
    async (request: GenericRouteRequest) => {
      return serializeContext(request)
    }
  )

  server.delete(
    "/impersonation/current",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["User"],
        summary: "Exit the active impersonation session",
      },
    },
    async (request: GenericRouteRequest, reply) => {
      const context = request.impersonation

      if (!context) {
        reply.clearCookie(
          IMPERSONATION_COOKIE_NAME,
          getImpersonationCookieOptions()
        )
        return { message: "No active impersonation session" }
      }

      await endImpersonationSession({
        token: context.token,
        endedReason: "admin_exit",
      })

      reply.clearCookie(
        IMPERSONATION_COOKIE_NAME,
        getImpersonationCookieOptions()
      )

      await createAdminAuditLog({
        adminUserId: context.admin.id,
        action: "customer.impersonation.end",
        entityType: "user",
        entityId: context.target.id,
        reason: "Administrator exited impersonation",
        metadata: {
          impersonationSessionId: context.sessionId,
          mode: context.mode,
        },
      })

      return {
        message: "Impersonation ended",
        redirectTo: `/users/${context.target.id}`,
      }
    }
  )
}
