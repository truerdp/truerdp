import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { db } from "../db.js"
import { users } from "../schema.js"
import { eq } from "drizzle-orm"
import { loginSchema } from "../validators/auth.js"

export async function authRoutes(server: FastifyInstance) {
  server.post("/auth/login", async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1)

      const user = result[0]

      // ✅ FIX: explicit check
      if (!user) {
        return reply.status(401).send({ error: "Invalid credentials" })
      }

      const validPassword = await bcrypt.compare(
        body.password,
        user.passwordHash
      )

      if (!validPassword) {
        return reply.status(401).send({ error: "Invalid credentials" })
      }

      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      )

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      }
    } catch (err: any) {
      server.log.error(err) // 👈 important
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })
}
