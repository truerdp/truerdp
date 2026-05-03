export type AuditLogItem = {
  id: number
  adminUserId: number | null
  action: string
  entityType: string
  entityId: number | null
  reason: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  createdAt: string
  admin: {
    id: number | null
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

export type AuditLogResponse = {
  items: AuditLogItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export function toPrettyJson(value: unknown) {
  if (!value) {
    return "-"
  }

  try {
    return JSON.stringify(value)
  } catch {
    return "-"
  }
}

type AuditLogQueryParams = {
  page: number
  pageSize: number
  action?: string
  entityType?: string
  adminUserId?: string
}

export function buildAuditLogSearchParams(params: AuditLogQueryParams) {
  const searchParams = new URLSearchParams()
  searchParams.set("page", String(params.page))
  searchParams.set("pageSize", String(params.pageSize))

  if (params.action) {
    searchParams.set("action", params.action)
  }

  if (params.entityType) {
    searchParams.set("entityType", params.entityType)
  }

  if (params.adminUserId) {
    searchParams.set("adminUserId", params.adminUserId)
  }

  return searchParams
}

