import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import { db } from "../db.js"
import { users } from "../schema.js"
import { createUserSchema } from "../validators/user.js"
import { verifyAuth } from "../middleware/auth.js"
import { eq } from "drizzle-orm"

export async function userRoutes(server: FastifyInstance) {
  // Create user (for testing, remove in production or protect with admin auth)
  server.post("/users", async (request, reply) => {
    try {
      const body = createUserSchema.parse(request.body)

      const hashedPassword = await bcrypt.hash(body.password, 10)
      const emailLocalPart = body.email.split("@")[0] || "User"

      const newUser = await db
        .insert(users)
        .values({
          email: body.email,
          passwordHash: hashedPassword,
          firstName: body.firstName ?? emailLocalPart,
          lastName: body.lastName ?? "User",
        })
        .returning()

      return reply.status(201).send(newUser[0])
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })

  // Get current user
  server.get("/me", { preHandler: verifyAuth }, async (request: any) => {
    return { user: request.user }
  }) // Get current user profile

  server.get(
    "/profile",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const userId = request.user.userId

        const result = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            discountPercent: users.discountPercent,
            discountFlat: users.discountFlat,
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
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )
}
