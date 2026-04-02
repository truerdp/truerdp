import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import { db } from "../db.js"
import { users } from "../schema.js"
import { createUserSchema } from "../validators/user.js"

export async function userRoutes(server: FastifyInstance) {
  server.post("/users", async (request, reply) => {
    try {
      const body = createUserSchema.parse(request.body)

      const hashedPassword = await bcrypt.hash(body.password, 10)

      const newUser = await db
        .insert(users)
        .values({
          email: body.email,
          passwordHash: hashedPassword,
        })
        .returning()

      return reply.status(201).send(newUser[0])
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })
}
