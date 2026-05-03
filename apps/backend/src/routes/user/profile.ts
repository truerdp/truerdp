import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { users } from "../../schema.js"
import { updateProfileSchema as updateProfileZod } from "../../validators/user.js"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest, RouteReply } from "../../types/requests.js"
import {
  getUserProfileSchema,
  updateProfileSchema,
} from "../../schemas/user.schemas.js"

export async function registerUserProfileRoutes(server: FastifyInstance) {
  server.get(
    "/profile",
    { preHandler: verifyAuth, schema: getUserProfileSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const userId = request.user!.userId

        const result = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        const user = result[0]

        if (!user) {
          return reply.status(404).send({ error: "User not found" })
        }

        return user
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.patch(
    "/profile",
    { preHandler: verifyAuth, schema: updateProfileSchema },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = updateProfileZod.parse(request.body ?? {})
        const userId = request.user!.userId
        const normalizedEmail = body.email.trim().toLowerCase()

        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!currentUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        if (normalizedEmail !== currentUser.email) {
          const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1)

          if (existingUser && existingUser.id !== userId) {
            return reply.status(409).send({
              error: "Email already in use",
            })
          }
        }

        const nextName = `${body.firstName} ${body.lastName}`.trim()

        const [updatedUser] = await db
          .update(users)
          .set({
            name: nextName,
            email: normalizedEmail,
            firstName: body.firstName,
            lastName: body.lastName,
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            createdAt: users.createdAt,
          })

        return updatedUser
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: err instanceof Error ? err.message : "Invalid request",
        })
      }
    }
  )
}
