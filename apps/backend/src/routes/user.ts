import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import { db } from "../db.js"
import { users } from "../schema.js"
import { createUserSchema, updateProfileSchema } from "../validators/user.js"
import { verifyAuth } from "../middleware/auth.js"
import { eq } from "drizzle-orm"
import { sendWelcomeEmail } from "../services/email.js"
import type { GenericRouteRequest, RouteReply } from "../types/requests.js"
import { getErrorMessage } from "../utils/error.js"

export async function userRoutes(server: FastifyInstance) {
  // Public signup route
  server.post("/users", async (request, reply) => {
    try {
      const body = createUserSchema.parse(request.body)
      const normalizedEmail = body.email.trim().toLowerCase()
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existingUser[0]) {
        return reply.status(409).send({
          error: "Email already in use",
        })
      }

      const hashedPassword = await bcrypt.hash(body.password, 10)
      const emailLocalPart = normalizedEmail.split("@")[0] || "User"

      const newUser = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash: hashedPassword,
          firstName: body.firstName ?? emailLocalPart,
          lastName: body.lastName ?? "User",
        })
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          createdAt: users.createdAt,
        })

      const createdUser = newUser[0]

      if (createdUser) {
        sendWelcomeEmail({
          to: createdUser.email,
          firstName: createdUser.firstName,
        }).catch((emailError) => {
          request.log.error(
            { email: createdUser.email, err: emailError },
            "Failed to send welcome email"
          )
        })
      }

      return reply.status(201).send(createdUser)
    } catch (err: unknown) {
      return reply.status(400).send({
        error: getErrorMessage(err),
      })
    }
  })

  // Get current user
  server.get(
    "/me",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest) => {
    return { user: request.user }
  }) // Get current user profile

  server.get(
    "/profile",
    { preHandler: verifyAuth },
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
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply: RouteReply) => {
      try {
        const body = updateProfileSchema.parse(request.body ?? {})
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

        let passwordHash = currentUser.passwordHash

        if (body.newPassword) {
          const validPassword = await bcrypt.compare(
            body.currentPassword ?? "",
            currentUser.passwordHash
          )

          if (!validPassword) {
            return reply.status(400).send({
              error: "Current password is incorrect",
            })
          }

          passwordHash = await bcrypt.hash(body.newPassword, 10)
        }

        const [updatedUser] = await db
          .update(users)
          .set({
            email: normalizedEmail,
            firstName: body.firstName,
            lastName: body.lastName,
            passwordHash,
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
          error: getErrorMessage(err),
        })
      }
    }
  )
}
