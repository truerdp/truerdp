import { FastifyRequest, FastifyReply } from "fastify"
import { fromNodeHeaders } from "better-auth/node"

import { auth } from "../auth.js"
import { db } from "../db.js"
import { parseAuthUser } from "../types/auth.js"
import { users } from "../schema.js"
import { eq } from "drizzle-orm"
import {
  getActiveImpersonationByToken,
  IMPERSONATION_COOKIE_NAME,
  type ActiveImpersonationContext,
} from "../services/impersonation.js"

declare module "fastify" {
  interface FastifyRequest {
    user?: import("../types/auth.js").AuthUser
    realUser?: import("../types/auth.js").AuthUser
    impersonation?: ActiveImpersonationContext
  }
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!session?.user) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    const sessionUser = session.user as {
      id?: string | number
      role?: string
      email?: string
    }

    const userId = Number(sessionUser.id)

    if (!Number.isInteger(userId) || userId <= 0) {
      return reply.status(401).send({ error: "Invalid session" })
    }

    let role = sessionUser.role
    let email = sessionUser.email

    if (!role || !email) {
      const [dbUser] = await db
        .select({
          role: users.role,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!dbUser) {
        return reply.status(401).send({ error: "Unauthorized" })
      }

      role = role ?? dbUser.role
      email = email ?? dbUser.email
    }

    const parsedUser = parseAuthUser({
      userId,
      role,
      email,
    })

    if (!parsedUser.success) {
      return reply.status(401).send({ error: "Invalid session payload" })
    }

    request.realUser = parsedUser.data
    request.user = parsedUser.data

    const impersonationToken = request.cookies?.[IMPERSONATION_COOKIE_NAME]

    if (!impersonationToken) {
      return
    }

    const impersonation =
      await getActiveImpersonationByToken(impersonationToken)

    if (!impersonation) {
      reply.clearCookie(IMPERSONATION_COOKIE_NAME, { path: "/" })
      return
    }

    if (impersonation.admin.id !== parsedUser.data.userId) {
      return reply.status(403).send({ error: "Forbidden impersonation" })
    }

    const impersonatedUser = parseAuthUser({
      userId: impersonation.target.id,
      role: impersonation.target.role,
      email: impersonation.target.email,
      actingUserId: impersonation.admin.id,
      impersonationSessionId: impersonation.sessionId,
    })

    if (!impersonatedUser.success) {
      return reply.status(401).send({ error: "Invalid impersonation context" })
    }

    request.impersonation = impersonation
    request.user = impersonatedUser.data
  } catch {
    return reply.status(401).send({ error: "Invalid token" })
  }
}
