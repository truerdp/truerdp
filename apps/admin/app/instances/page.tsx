"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  MoreHorizontalCircle01Icon,
  Package02Icon,
} from "@hugeicons/core-free-icons"
import { AdminUserLink } from "@/components/admin-user-link"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
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
import { useAllInstances, type Instance } from "@/hooks/use-all-instances"
import { ProvisionInstanceDialog } from "@/components/provision-instance-dialog"
import { SuspendInstanceDialog } from "@/components/suspend-instance-dialog"
import { adminPaths } from "@/lib/paths"
import { AdminPaginationControls } from "@/components/admin-pagination-controls"
import { useTerminateInstance } from "@/hooks/use-terminate-instance"

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

function getStatusVariant(
  status: Instance["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "suspended":
      return "destructive"
    case "pending":
    case "provisioning":
      return "outline"
    case "expired":
      return "secondary"
    case "termination_pending":
    case "terminated":
      return "destructive"
    default:
      return "secondary"
  }
}

function getResourceStatusVariant(
  status: Instance["resourceStatus"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "released":
      return "outline"
    default:
      return "secondary"
  }
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function InstancesSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Expiry Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function InstancesEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No instances</EmptyTitle>
        <EmptyDescription>
          Instances will appear here when customers purchase plans.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function AdminInstancesPage() {
  const router = useRouter()
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
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="w-40">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => {
                  const needsProvisioning =
                    !instance.ipAddress || instance.status === "pending"

                  return (
                    <TableRow key={instance.id}>
                      <TableCell>
                        <div className="font-mono text-sm">#{instance.id}</div>
                      </TableCell>
                      <TableCell>
                        <AdminUserLink
                          userId={instance.userId}
                          primary={`User #${instance.userId}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(instance.status)}>
                          {formatStatus(instance.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {instance.ipAddress || "-"}
                      </TableCell>
                      <TableCell>
                        {instance.resourceStatus ? (
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={getResourceStatusVariant(
                                instance.resourceStatus
                              )}
                            >
                              {formatStatus(instance.resourceStatus)}
                            </Badge>
                            {instance.provider && (
                              <span className="text-xs text-muted-foreground">
                                {instance.provider}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(instance.startDate)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>{formatDateTime(instance.expiryDate)}</span>
                          {instance.extensionCount > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {instance.extensionCount} extension
                              {instance.extensionCount === 1 ? "" : "s"} •{" "}
                              {instance.lastExtensionDays
                                ? `last +${instance.lastExtensionDays}d`
                                : "latest extension"}
                              {instance.lastExtensionAt
                                ? ` on ${formatDateTime(instance.lastExtensionAt)}`
                                : ""}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button size="icon-sm" variant="outline" />}
                          >
                            <HugeiconsIcon
                              icon={MoreHorizontalCircle01Icon}
                              strokeWidth={2}
                              data-icon="inline-start"
                            />
                            <span className="sr-only">Open actions</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  adminPaths.instanceDetails(instance.id)
                                )
                              }
                            >
                              View
                            </DropdownMenuItem>
                            {needsProvisioning ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleProvisionInstance(instance.id)
                                }
                              >
                                Provision
                              </DropdownMenuItem>
                            ) : null}
                            {instance.status === "suspended" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSuspendInstance(instance.id, "unsuspend")
                                }
                              >
                                Undo suspension
                              </DropdownMenuItem>
                            ) : instance.status !== "terminated" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSuspendInstance(instance.id, "suspend")
                                }
                                variant="destructive"
                              >
                                Suspend
                              </DropdownMenuItem>
                            ) : null}
                            {instance.status !== "terminated" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleTerminateInstance(instance.id)
                                }
                                variant="destructive"
                              >
                                Terminate
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

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
