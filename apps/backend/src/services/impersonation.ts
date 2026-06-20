import { randomBytes } from "node:crypto"
import { and, eq, gt, isNull } from "drizzle-orm"

import { db } from "../db.js"
import { impersonationSessions, users } from "../schema.js"

export const IMPERSONATION_COOKIE_NAME = "truerdp.impersonation"
export const IMPERSONATION_DURATION_MS = 60 * 60 * 1000
export const IMPERSONATION_EXPIRY_WARNING_MS = 5 * 60 * 1000

export type ImpersonationMode = "full"

export type ActiveImpersonationContext = {
  sessionId: number
  token: string
  mode: ImpersonationMode
  reason: string
  startedAt: Date
  expiresAt: Date
  admin: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: "admin"
  }
  target: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: "user" | "operator" | "admin"
  }
}

export function createImpersonationToken() {
  return randomBytes(32).toString("base64url")
}

export function getImpersonationCookieOptions(expiresAt?: Date) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  }
}

export async function createImpersonationSession(input: {
  adminUserId: number
  targetUserId: number
  mode: ImpersonationMode
  reason: string
  ipAddress?: string | null
  userAgent?: string | null
}) {
  const token = createImpersonationToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + IMPERSONATION_DURATION_MS)

  const [session] = await db
    .insert(impersonationSessions)
    .values({
      token,
      adminUserId: input.adminUserId,
      targetUserId: input.targetUserId,
      mode: input.mode,
      reason: input.reason,
      startedAt: now,
      expiresAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning()

  if (!session) {
    throw new Error("Failed to create impersonation session")
  }

  return session
}

export async function getActiveImpersonationByToken(token: string) {
  const now = new Date()
  const [row] = await db
    .select({
      session: impersonationSessions,
      admin: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
      },
    })
    .from(impersonationSessions)
    .innerJoin(users, eq(impersonationSessions.adminUserId, users.id))
    .where(
      and(
        eq(impersonationSessions.token, token),
        isNull(impersonationSessions.endedAt)
      )
    )
    .limit(1)

  if (!row) {
    return null
  }

  if (row.session.expiresAt <= now) {
    await endImpersonationSession({
      token,
      endedReason: "expired",
    })
    return null
  }

  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, row.session.targetUserId))
    .limit(1)

  if (!target || row.admin.role !== "admin") {
    await endImpersonationSession({
      token,
      endedReason: "invalid_context",
    })
    return null
  }

  await db
    .update(impersonationSessions)
    .set({ lastSeenAt: now })
    .where(
      and(
        eq(impersonationSessions.token, token),
        isNull(impersonationSessions.endedAt),
        gt(impersonationSessions.expiresAt, now)
      )
    )

  return {
    sessionId: row.session.id,
    token,
    mode: row.session.mode as ImpersonationMode,
    reason: row.session.reason,
    startedAt: row.session.startedAt,
    expiresAt: row.session.expiresAt,
    admin: {
      id: row.admin.id,
      email: row.admin.email,
      firstName: row.admin.firstName,
      lastName: row.admin.lastName,
      role: "admin" as const,
    },
    target,
  } satisfies ActiveImpersonationContext
}

export async function endImpersonationSession(input: {
  token: string
  endedReason: string
}) {
  const [session] = await db
    .update(impersonationSessions)
    .set({
      endedAt: new Date(),
      endedReason: input.endedReason,
    })
    .where(
      and(
        eq(impersonationSessions.token, input.token),
        isNull(impersonationSessions.endedAt)
      )
    )
    .returning()

  return session ?? null
}
