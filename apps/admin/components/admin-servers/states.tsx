import { HugeiconsIcon } from "@hugeicons/react"
import { Package02Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@workspace/ui/components/badge"
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

export function ServersEmpty() {
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

export function ServersSkeleton() {
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

type StatusSummaryCardProps = {
  label: string
  value: number
  tone: "default" | "secondary" | "outline" | "destructive"
}

export function StatusSummaryCard({ label, value, tone }: StatusSummaryCardProps) {
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
