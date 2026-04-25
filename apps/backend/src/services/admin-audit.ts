import { and, desc, eq, sql } from "drizzle-orm"
import { db } from "../db.js"
import { adminAuditLogs, users } from "../schema.js"

type JsonMap = Record<string, unknown>

export async function createAdminAuditLog(input: {
  adminUserId?: number | null
  action: string
  entityType: string
  entityId?: number | null
  reason: string
  beforeState?: JsonMap | null
  afterState?: JsonMap | null
  metadata?: JsonMap | null
}) {
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    reason: input.reason,
    beforeState: input.beforeState ?? null,
    afterState: input.afterState ?? null,
    metadata: input.metadata ?? null,
  })
}

export async function listAdminAuditLogs(params: {
  page: number
  pageSize: number
  action?: string
  entityType?: string
  entityId?: number
  adminUserId?: number
}) {
  const conditions = []

  if (params.action) {
    conditions.push(eq(adminAuditLogs.action, params.action))
  }

  if (params.entityType) {
    conditions.push(eq(adminAuditLogs.entityType, params.entityType))
  }

  if (typeof params.entityId === "number") {
    conditions.push(eq(adminAuditLogs.entityId, params.entityId))
  }

  if (typeof params.adminUserId === "number") {
    conditions.push(eq(adminAuditLogs.adminUserId, params.adminUserId))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(adminAuditLogs)
    .where(whereClause)

  const totalCount = Number(countResult[0]?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / params.pageSize))
  const page = Math.min(params.page, totalPages)
  const effectiveOffset = (page - 1) * params.pageSize

  const rows = await db
    .select({
      id: adminAuditLogs.id,
      adminUserId: adminAuditLogs.adminUserId,
      action: adminAuditLogs.action,
      entityType: adminAuditLogs.entityType,
      entityId: adminAuditLogs.entityId,
      reason: adminAuditLogs.reason,
      beforeState: adminAuditLogs.beforeState,
      afterState: adminAuditLogs.afterState,
      metadata: adminAuditLogs.metadata,
      createdAt: adminAuditLogs.createdAt,
      admin: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      },
    })
    .from(adminAuditLogs)
    .leftJoin(users, eq(adminAuditLogs.adminUserId, users.id))
    .where(whereClause)
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(params.pageSize)
    .offset(effectiveOffset)

  return {
    items: rows,
    pagination: {
      page,
      pageSize: params.pageSize,
      totalCount,
      totalPages,
    },
  }
}
