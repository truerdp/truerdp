"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { queryKeys } from "@/lib/query-keys"

type AuditLogItem = {
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

type AuditLogResponse = {
  items: AuditLogItem[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

function toPrettyJson(value: unknown) {
  if (!value) {
    return "-"
  }

  try {
    return JSON.stringify(value)
  } catch {
    return "-"
  }
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("")
  const [entityTypeFilter, setEntityTypeFilter] = useState("")
  const [adminUserIdFilter, setAdminUserIdFilter] = useState("")

  const params = useMemo(
    () => ({
      page,
      pageSize: 20,
      action: actionFilter.trim() || undefined,
      entityType: entityTypeFilter.trim() || undefined,
      adminUserId: adminUserIdFilter.trim() || undefined,
    }),
    [page, actionFilter, entityTypeFilter, adminUserIdFilter]
  )

  const query = useQuery<AuditLogResponse>({
    queryKey: queryKeys.auditLogs(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(params.page))
      searchParams.set("pageSize", "20")

      if (params.action) {
        searchParams.set("action", params.action)
      }

      if (params.entityType) {
        searchParams.set("entityType", params.entityType)
      }

      if (params.adminUserId) {
        searchParams.set("adminUserId", params.adminUserId)
      }

      return clientApi(`/admin/audit-logs?${searchParams.toString()}`)
    },
  })

  const items = query.data?.items ?? []
  const pagination = query.data?.pagination

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Track admin actions with reasons and before/after state snapshots.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Filter action"
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value)
            setPage(1)
          }}
        />
        <Input
          placeholder="Filter entity type"
          value={entityTypeFilter}
          onChange={(event) => {
            setEntityTypeFilter(event.target.value)
            setPage(1)
          }}
        />
        <Input
          placeholder="Filter admin user id"
          value={adminUserIdFilter}
          onChange={(event) => {
            setAdminUserIdFilter(event.target.value)
            setPage(1)
          }}
        />
        <Button
          variant="outline"
          onClick={() => {
            setActionFilter("")
            setEntityTypeFilter("")
            setAdminUserIdFilter("")
            setPage(1)
          }}
        >
          Reset filters
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Before</TableHead>
              <TableHead>After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  {query.isLoading ? "Loading logs..." : "No audit logs found."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.action}</TableCell>
                  <TableCell className="text-xs">
                    {item.entityType}
                    {item.entityId ? ` #${item.entityId}` : ""}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.admin?.email
                      ? `${item.admin.email} (#${item.admin.id})`
                      : "System"}
                  </TableCell>
                  <TableCell className="max-w-72 text-xs">{item.reason}</TableCell>
                  <TableCell className="max-w-72 font-mono text-[11px]">
                    {toPrettyJson(item.beforeState)}
                  </TableCell>
                  <TableCell className="max-w-72 font-mono text-[11px]">
                    {toPrettyJson(item.afterState)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination ? (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)} ·{" "}
            {pagination.totalCount} total
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((value) => Math.min(pagination.totalPages, value + 1))
              }
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
