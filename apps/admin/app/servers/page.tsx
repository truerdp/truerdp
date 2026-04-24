"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Package02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { ServerFormDialog } from "@/components/server-form-dialog"
import {
  type CreateServerInput,
  useCreateServer,
  useServers,
  useUpdateServerStatus,
  type ServerInventoryItem,
} from "@/hooks/use-servers"

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getStatusVariant(
  status: ServerInventoryItem["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "available":
      return "default"
    case "assigned":
      return "secondary"
    case "cleaning":
      return "outline"
    case "retired":
      return "destructive"
    default:
      return "secondary"
  }
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function ServersEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No servers registered</EmptyTitle>
        <EmptyDescription>
          Package Add inventory servers here so provisioning can allocate from
          the pool.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function ServersSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Server</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Specs</TableHead>
          <TableHead>Assignment</TableHead>
          <TableHead>Last Assigned</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, index) => (
          <TableRow key={index}>
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-4 w-28" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StatusSummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "default" | "secondary" | "outline" | "destructive"
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Badge variant={tone}>{label}</Badge>
      </div>
    </div>
  )
}

export default function ServersPage() {
  const { data, isLoading, isError, error } = useServers()
  const createServer = useCreateServer()
  const updateServerStatus = useUpdateServerStatus()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const servers = data ?? []

  const summary = useMemo(() => {
    return servers.reduce(
      (accumulator, server) => {
        accumulator.total += 1
        accumulator[server.status] += 1
        return accumulator
      },
      {
        total: 0,
        available: 0,
        assigned: 0,
        cleaning: 0,
        retired: 0,
      }
    )
  }, [servers])

  const handleCreateServer = async (input: CreateServerInput) => {
    await createServer.mutateAsync(input)
    setCreateDialogOpen(false)
  }

  return (
    <section className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Servers</h1>
          <p className="text-sm text-muted-foreground">
            Manage the inventory pool used by provisioning and cleanup flows.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <HugeiconsIcon
            icon={Package02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Add Server
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatusSummaryCard
          label="Total"
          value={summary.total}
          tone="secondary"
        />
        <StatusSummaryCard
          label="Available"
          value={summary.available}
          tone="default"
        />
        <StatusSummaryCard
          label="Assigned"
          value={summary.assigned}
          tone="outline"
        />
        <StatusSummaryCard
          label="Cleaning"
          value={summary.cleaning}
          tone="destructive"
        />
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <ServersSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load servers."}</span>
        </div>
      ) : servers.length === 0 ? (
        <div className="rounded-lg border">
          <ServersEmpty />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Server</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specs</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Last Assigned</TableHead>
                <TableHead className="w-[320px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.map((server) => (
                <TableRow
                  key={server.id}
                  className={cn(server.status === "retired" && "opacity-70")}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">
                        {server.ipAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {server.provider}
                        {server.externalId ? ` · ${server.externalId}` : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(server.status)}>
                      {formatStatus(server.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {server.cpu} vCPU · {server.ram} GB RAM · {server.storage}{" "}
                      GB Storage
                    </div>
                  </TableCell>
                  <TableCell>
                    {server.activeInstanceId ? (
                      <div className="space-y-1 text-sm">
                        <div className="font-medium">
                          Instance #{server.activeInstanceId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Resource #{server.activeResourceId}{" "}
                          {server.activeResourceUsername
                            ? `· ${server.activeResourceUsername}`
                            : ""}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Not assigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(server.lastAssignedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          server.status === "available" ? "default" : "outline"
                        }
                        onClick={() =>
                          updateServerStatus.mutate({
                            serverId: server.id,
                            status: "available",
                          })
                        }
                        disabled={
                          updateServerStatus.isPending ||
                          server.status === "available"
                        }
                      >
                        Available
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          server.status === "cleaning" ? "default" : "outline"
                        }
                        onClick={() =>
                          updateServerStatus.mutate({
                            serverId: server.id,
                            status: "cleaning",
                          })
                        }
                        disabled={
                          updateServerStatus.isPending ||
                          server.status === "cleaning"
                        }
                      >
                        Cleaning
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          server.status === "retired"
                            ? "destructive"
                            : "outline"
                        }
                        onClick={() =>
                          updateServerStatus.mutate({
                            serverId: server.id,
                            status: "retired",
                          })
                        }
                        disabled={
                          updateServerStatus.isPending ||
                          server.status === "retired"
                        }
                      >
                        Retire
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ServerFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        isPending={createServer.isPending}
        onSubmit={handleCreateServer}
      />
    </section>
  )
}
