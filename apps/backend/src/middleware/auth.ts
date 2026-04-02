import jwt from "jsonwebtoken"
import { FastifyRequest, FastifyReply } from "fastify"

declare module "fastify" {
  interface FastifyRequest {
    user?: any
  }
}

export async function verifyAuth(request: FastifyRequest, reply: FastifyReply) {
  //   console.log("AUTH HEADER:", request.headers.authorization)

  try {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return reply.status(401).send({ error: "Unauthorized" })
    }

    const jwtSecret = process.env.JWT_SECRET as string

    if (!jwtSecret) {
      return reply.status(500).send({ error: "JWT secret is not configured" })
    }

    const decoded = jwt.verify(token, jwtSecret)

    request.user = decoded
  } catch (err) {
    return reply.status(401).send({ error: "Invalid token" })
  }
}
