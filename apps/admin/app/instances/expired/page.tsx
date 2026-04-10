"use client"

import { format } from "date-fns"
import ExtendInstanceDialog from "@/components/extend-instance-dialog"
import { ExpiredStatusBadge } from "@/components/instance-status-badge"
import TerminateInstanceDialog from "@/components/terminate-instance-dialog"
import { useExpiredInstances } from "@/hooks/use-expired-instances"
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
import { cn } from "@workspace/ui/lib/utils"
import { ComputerTerminalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

function formatDate(dateString: string | null) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

function getRowClassName(daysSinceExpiry: number) {
  if (daysSinceExpiry >= 3) {
    return "bg-destructive/10 hover:bg-destructive/15"
  }

  if (daysSinceExpiry >= 1) {
    return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/20"
  }

  return undefined
}

function ExpiredInstancesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance ID</TableHead>
          <TableHead>User ID</TableHead>
          <TableHead>Plan ID</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Days Since Expiry</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ExpiredInstancesEmptyState({ description }: { description: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No expired instances found</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function ExpiredInstancesPage() {
  const { data, isLoading, isError, error } = useExpiredInstances()
  const expiredInstances = data ?? []

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expired Instances</h1>
        <p className="text-sm text-muted-foreground">
          Review expired instances and terminate them to release capacity.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <ExpiredInstancesTableSkeleton />
        </div>
      ) : isError ? (
        <div className="rounded-lg border">
          <ExpiredInstancesEmptyState
            description={error.message || "Unable to load expired instances."}
          />
        </div>
      ) : expiredInstances.length === 0 ? (
        <div className="rounded-lg border">
          <ExpiredInstancesEmptyState description="All instances are up to date." />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instance ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Plan ID</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Since Expiry</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expiredInstances.map((instance) => (
                <TableRow
                  key={instance.id}
                  className={cn(getRowClassName(instance.daysSinceExpiry))}
                >
                  <TableCell className="font-mono text-sm">
                    #{instance.id}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {instance.userId}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {instance.planId}
                  </TableCell>
                  <TableCell>{formatDate(instance.expiryDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <span className="font-medium">
                        {instance.daysSinceExpiry}
                      </span>
                      <ExpiredStatusBadge
                        daysSinceExpiry={instance.daysSinceExpiry}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ExtendInstanceDialog
                        instanceId={instance.id}
                        expiryDate={instance.expiryDate}
                      />
                      <TerminateInstanceDialog instanceId={instance.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
