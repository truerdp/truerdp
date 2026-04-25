import { createHash, randomBytes } from "node:crypto"
import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { db } from "../db.js"
import { passwordResetTokens, users } from "../schema.js"
import { and, eq, gt, isNull } from "drizzle-orm"
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../validators/auth.js"
import { verifyAuth } from "../middleware/auth.js"
import { sendPasswordResetEmail } from "../services/email.js"

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

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function buildResetPasswordUrl(token: string) {
  const configured =
    process.env.WEB_BASE_URL?.trim() || "http://localhost:3000"
  const url = new URL("/reset-password", configured)
  url.searchParams.set("token", token)
  return url.toString()
}

function shouldExposeDevResetLink() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.PASSWORD_RESET_EXPOSE_LINK === "true"
  )
}

export async function authRoutes(server: FastifyInstance) {
  server.post("/auth/login", async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body)
      const normalizedEmail = body.email.trim().toLowerCase()

      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
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

  server.post("/auth/forgot-password", async (request, reply) => {
    try {
      const body = forgotPasswordSchema.parse(request.body)
      const normalizedEmail = body.email.trim().toLowerCase()
      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      let resetUrl: string | null = null

      if (user) {
        const token = randomBytes(32).toString("hex")
        resetUrl = buildResetPasswordUrl(token)

        await db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        })

        try {
          const emailResult = await sendPasswordResetEmail({
            to: user.email,
            resetUrl,
          })

          server.log.info(
            {
              email: user.email,
              resetUrl,
              emailSent: emailResult.sent,
              emailId: emailResult.id,
              skippedReason: emailResult.skippedReason,
            },
            "Password reset link generated"
          )
        } catch (emailError) {
          server.log.error(
            { email: user.email, resetUrl, err: emailError },
            "Failed to send password reset email"
          )
        }
      }

      return reply.send({
        message:
          "If an account exists for that email, a password reset link has been generated.",
        resetUrl: shouldExposeDevResetLink() ? resetUrl : undefined,
      })
    } catch (err: any) {
      server.log.error(err)
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })

  server.post("/auth/reset-password", async (request, reply) => {
    try {
      const body = resetPasswordSchema.parse(request.body)
      const tokenHash = hashResetToken(body.token)
      const now = new Date()
      const [resetToken] = await db
        .select({
          id: passwordResetTokens.id,
          userId: passwordResetTokens.userId,
        })
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            gt(passwordResetTokens.expiresAt, now),
            isNull(passwordResetTokens.usedAt)
          )
        )
        .limit(1)

      if (!resetToken) {
        return reply.status(400).send({
          error: "Reset link is invalid or expired",
        })
      }

      const hashedPassword = await bcrypt.hash(body.password, 10)

      await db
        .update(users)
        .set({ passwordHash: hashedPassword })
        .where(eq(users.id, resetToken.userId))

      await db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id))

      return reply.send({ message: "Password has been reset" })
    } catch (err: any) {
      server.log.error(err)
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })

  server.get("/auth/session", { preHandler: verifyAuth }, async (request) => {
    return { user: request.user }
  })
}
