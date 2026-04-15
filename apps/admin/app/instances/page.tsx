"use client"

import { useState } from "react"
import { format } from "date-fns"
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
import { useAllInstances, type Instance } from "@/hooks/use-all-instances"
import { ProvisionInstanceDialog } from "@/components/provision-instance-dialog"

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
    case "running":
      return "default"
    case "creating":
      return "outline"
    case "deleted":
      return "destructive"
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
              <Skeleton className="h-6 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
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
  const { data, isLoading, isError, error } = useAllInstances()
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  )

  const instances = data ?? []

  const handleProvisionInstance = (instanceId: number) => {
    setSelectedInstanceId(instanceId)
    setProvisionDialogOpen(true)
  }

  return (
    <section className="space-y-4">
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
      ) : instances.length === 0 ? (
        <div className="rounded-lg border">
          <InstancesEmpty />
        </div>
      ) : (
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
                <TableHead className="w-24">Action</TableHead>
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
                    <TableCell className="font-mono text-sm">
                      {instance.userId}
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
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(instance.startDate)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(instance.expiryDate)}
                    </TableCell>
                    <TableCell>
                      {needsProvisioning && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProvisionInstance(instance.id)}
                        >
                          Provision
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProvisionInstanceDialog
        open={provisionDialogOpen}
        instanceId={selectedInstanceId || 0}
        onOpenChange={setProvisionDialogOpen}
      />
    </section>
  )
}
