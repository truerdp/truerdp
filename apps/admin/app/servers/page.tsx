"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, Package02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { ServerFormDialog } from "@/components/server-form-dialog"
import {
  type CreateServerInput,
  useCreateServer,
  useServers,
  useUpdateServerStatus,
} from "@/hooks/use-servers"
import { getServerSummary } from "@/components/admin-servers/helpers"
import { ServersEmpty, ServersSkeleton, StatusSummaryCard } from "@/components/admin-servers/states"
import { AdminServersTable } from "@/components/admin-servers/table"

export default function ServersPage() {
  const { data, isLoading, isError, error } = useServers()
  const createServer = useCreateServer()
  const updateServerStatus = useUpdateServerStatus()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const servers = data ?? []

  const summary = getServerSummary(servers)

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
        <AdminServersTable
          servers={servers}
          isPending={updateServerStatus.isPending}
          onSetStatus={(serverId, status) =>
            updateServerStatus.mutate({ serverId, status })
          }
        />
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
