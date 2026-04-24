"use client"

import { format } from "date-fns"
import {
  ExpiredStatusBadge,
  ExpiringSoonStatusBadge,
} from "@/components/instance-status-badge"
import ExtendInstanceDialog from "@/components/extend-instance-dialog"
import TerminateInstanceDialog from "@/components/terminate-instance-dialog"
import { useExpiredInstances } from "@/hooks/use-expired-instances"
import { useExpiringSoonInstances } from "@/hooks/use-expiring-soon-instances"
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
import { Alert02Icon, ComputerTerminalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

function getExpiringSoonRowClassName(daysUntilExpiry: number) {
  if (daysUntilExpiry === 0) {
    return "bg-destructive/10 hover:bg-destructive/15"
  }

  if (daysUntilExpiry === 1) {
    return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/20"
  }

  return undefined
}

function getExpiredRowClassName(daysSinceExpiry: number) {
  if (daysSinceExpiry >= 3) {
    return "bg-destructive/10 hover:bg-destructive/15"
  }

  if (daysSinceExpiry >= 1) {
    return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/20"
  }

  return undefined
}

function TableSkeleton({
  columns,
  rows = 4,
}: {
  columns: string[]
  rows?: number
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column}>
                <Skeleton className="h-4 w-24" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function DashboardEmptyState({ title }: { title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Everything looks clear right now.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
      <span>{message}</span>
    </div>
  )
}

export default function Page() {
  const {
    data: expiringSoonData,
    isLoading: isExpiringSoonLoading,
    isError: isExpiringSoonError,
    error: expiringSoonError,
  } = useExpiringSoonInstances()
  const {
    data: expiredData,
    isLoading: isExpiredLoading,
    isError: isExpiredError,
    error: expiredError,
  } = useExpiredInstances()

  const expiringSoonInstances = expiringSoonData ?? []
  const expiredInstances = expiredData ?? []

  return (
    <section className="min-w-0 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track upcoming expirations and clean up expired instances.
        </p>
      </div>

      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Expiring Soon</h2>
        {isExpiringSoonLoading ? (
          <div className="rounded-lg border">
            <TableSkeleton
              columns={["Instance ID", "Expiry Date", "Days Until Expiry"]}
            />
          </div>
        ) : isExpiringSoonError ? (
          <ErrorMessage
            message={
              expiringSoonError.message || "Failed to load expiring instances."
            }
          />
        ) : expiringSoonInstances.length === 0 ? (
          <div className="rounded-lg border">
            <DashboardEmptyState title="No instances expiring soon" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance ID</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Until Expiry</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringSoonInstances.map((instance) => (
                  <TableRow
                    key={instance.id}
                    className={cn(
                      getExpiringSoonRowClassName(instance.daysUntilExpiry)
                    )}
                  >
                    <TableCell className="font-mono text-sm">
                      #{instance.id}
                    </TableCell>
                    <TableCell>{formatDate(instance.expiryDate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <span className="font-medium">
                          {instance.daysUntilExpiry}
                        </span>
                        <ExpiringSoonStatusBadge
                          daysUntilExpiry={instance.daysUntilExpiry}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <ExtendInstanceDialog
                        instanceId={instance.id}
                        expiryDate={instance.expiryDate}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="min-w-0 space-y-3">
        <h2 className="text-lg font-semibold">Expired Instances</h2>
        {isExpiredLoading ? (
          <div className="rounded-lg border">
            <TableSkeleton
              columns={[
                "Instance ID",
                "Expiry Date",
                "Days Since Expiry",
                "Action",
              ]}
            />
          </div>
        ) : isExpiredError ? (
          <ErrorMessage
            message={
              expiredError.message || "Failed to load expired instances."
            }
          />
        ) : expiredInstances.length === 0 ? (
          <div className="rounded-lg border">
            <DashboardEmptyState title="No expired instances" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instance ID</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Days Since Expiry</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredInstances.map((instance) => (
                  <TableRow
                    key={instance.id}
                    className={cn(
                      getExpiredRowClassName(instance.daysSinceExpiry)
                    )}
                  >
                    <TableCell className="font-mono text-sm">
                      #{instance.id}
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
    </section>
  )
}
