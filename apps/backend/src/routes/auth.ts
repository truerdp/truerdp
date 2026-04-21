import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { db } from "../db.js"
import { users } from "../schema.js"
import { eq } from "drizzle-orm"
import { loginSchema } from "../validators/auth.js"
import { verifyAuth } from "../middleware/auth.js"

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "truerdp_session"

function getCookieSameSite() {
  const value = (process.env.AUTH_COOKIE_SAME_SITE ?? "lax").toLowerCase()

  if (value === "strict" || value === "none") {
    return value
  }

  return "lax"
}

function getAuthCookieConfig() {
  return {
    path: "/",
    domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    httpOnly: true,
    sameSite: getCookieSameSite() as "strict" | "lax" | "none",
    secure:
      process.env.AUTH_COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE ?? 60 * 60 * 24 * 7),
  }
}

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
          email: user.email,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      )

      reply.setCookie(AUTH_COOKIE_NAME, token, getAuthCookieConfig())

      return {
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

  server.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, {
      path: "/",
      domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
      sameSite: getCookieSameSite() as "strict" | "lax" | "none",
      secure:
        process.env.AUTH_COOKIE_SECURE === "true" ||
        process.env.NODE_ENV === "production",
    })

    return { success: true }
  })

  server.get("/auth/session", { preHandler: verifyAuth }, async (request) => {
    return { user: request.user }
  })
}
