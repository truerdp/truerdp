"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { useAllInstances } from "@/hooks/use-all-instances"
import { ProvisionInstanceDialog } from "@/components/provision-instance-dialog"
import { SuspendInstanceDialog } from "@/components/suspend-instance-dialog"
import { AdminPaginationControls } from "@/components/admin-pagination-controls"
import { useTerminateInstance } from "@/hooks/use-terminate-instance"
import { InstancesEmpty, InstancesSkeleton } from "@/components/admin-instances/states"
import { AdminInstancesTable } from "@/components/admin-instances/table"

export default function AdminInstancesPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { data, isLoading, isError, error } = useAllInstances({
    page,
    pageSize,
  })
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  )
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false)
  const [selectedTerminateInstanceId, setSelectedTerminateInstanceId] =
    useState<number | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [selectedSuspendInstance, setSelectedSuspendInstance] = useState<{
    instanceId: number
    mode: "suspend" | "unsuspend"
  } | null>(null)
  const terminateInstance = useTerminateInstance()

  const instances = data?.items ?? []
  const pagination = data?.pagination
  const totalCount = pagination?.totalCount ?? 0
  const pageStart =
    totalCount === 0 || !pagination
      ? 0
      : (pagination.page - 1) * pagination.pageSize + 1
  const pageEnd =
    totalCount === 0 || !pagination
      ? 0
      : Math.min(pageStart + instances.length - 1, totalCount)

  const handleProvisionInstance = (instanceId: number) => {
    setSelectedInstanceId(instanceId)
    setProvisionDialogOpen(true)
  }

  const handleTerminateInstance = (instanceId: number) => {
    setSelectedTerminateInstanceId(instanceId)
    setTerminateDialogOpen(true)
  }

  const handleSuspendInstance = (
    instanceId: number,
    mode: "suspend" | "unsuspend"
  ) => {
    setSelectedSuspendInstance({ instanceId, mode })

    window.setTimeout(() => {
      setSuspendDialogOpen(true)
    }, 0)
  }

  const confirmTerminateInstance = async () => {
    if (!selectedTerminateInstanceId) {
      return
    }

    try {
      await terminateInstance.mutateAsync(selectedTerminateInstanceId)
      setTerminateDialogOpen(false)
      setSelectedTerminateInstanceId(null)
    } catch {
      // Mutation hook handles errors.
    }
  }

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Instances</h1>
        <p className="text-sm text-muted-foreground">
          View and manage all provisioned instances across your platform.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <InstancesSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load instances."}</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="rounded-lg border">
          <InstancesEmpty />
        </div>
      ) : (
        <div className="space-y-3">
          <AdminInstancesTable
            instances={instances}
            onProvision={handleProvisionInstance}
            onTerminate={handleTerminateInstance}
            onSuspendToggle={handleSuspendInstance}
          />

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {pagination ? (
              <AdminPaginationControls
                page={pagination.page}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalCount={pagination.totalCount}
                pageStart={pageStart}
                pageEnd={pageEnd}
                onPageChange={setPage}
                onPageSizeChange={(value) => {
                  setPage(1)
                  setPageSize(value)
                }}
              />
            ) : null}
          </div>
        </div>
      )}

      <ProvisionInstanceDialog
        open={provisionDialogOpen}
        instanceId={selectedInstanceId || 0}
        onOpenChange={setProvisionDialogOpen}
      />

      {selectedSuspendInstance ? (
        <SuspendInstanceDialog
          open={suspendDialogOpen}
          onOpenChange={(open) => {
            setSuspendDialogOpen(open)

            if (!open) {
              setSelectedSuspendInstance(null)
            }
          }}
          instanceId={selectedSuspendInstance.instanceId}
          mode={selectedSuspendInstance.mode}
          trigger="none"
        />
      ) : null}

      <AlertDialog
        open={terminateDialogOpen}
        onOpenChange={setTerminateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate instance?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate this instance? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={terminateInstance.isPending}
              onClick={() => setSelectedTerminateInstanceId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={terminateInstance.isPending}
              onClick={confirmTerminateInstance}
            >
              {terminateInstance.isPending ? "Terminating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
