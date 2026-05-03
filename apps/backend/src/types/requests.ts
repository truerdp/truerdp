import type { FastifyReply, FastifyRequest } from "fastify"

import type { AuthUser } from "./auth.js"

export type AuthenticatedRequest = FastifyRequest & {
  user: AuthUser
}

export type GenericRouteRequest = FastifyRequest

export type RouteReply = FastifyReply
