import type { FastifyReply, FastifyRequest } from "fastify"

import type { AuthUser } from "../types/auth.js"

export function requireAdmin(
  user: FastifyRequest["user"],
  reply: FastifyReply
): user is AuthUser {
  if (!user || user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}
