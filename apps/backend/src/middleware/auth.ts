import jwt from "jsonwebtoken"
import { FastifyRequest, FastifyReply } from "fastify"

import { parseAuthUser } from "../types/auth.js"

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "truerdp_session"

function extractBearerToken(authHeader?: string) {
  if (!authHeader) {
    return null
  }

  const [type, token] = authHeader.split(" ")

  if (type !== "Bearer" || !token) {
    return null
  }

  return token
}

declare module "fastify" {
  interface FastifyRequest {
    user?: import("../types/auth.js").AuthUser
  }
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const cookieToken = (
      request as FastifyRequest & {
        cookies?: Record<string, string | undefined>
      }
    ).cookies?.[AUTH_COOKIE_NAME]

    const token =
      cookieToken ?? extractBearerToken(request.headers.authorization)

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    const jwtSecret = process.env.JWT_SECRET as string

    if (!jwtSecret) {
      return reply.status(500).send({ error: "JWT secret is not configured" })
    }

    const decoded = jwt.verify(token, jwtSecret)
    const parsedUser = parseAuthUser(decoded)

    if (!parsedUser.success) {
      return reply.status(401).send({ error: "Invalid token payload" })
    }

    request.user = parsedUser.data
  } catch {
    return reply.status(401).send({ error: "Invalid token" })
  }
}
