import { HugeiconsIcon } from "@hugeicons/react"
import { UserAdd01Icon } from "@hugeicons/core-free-icons"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export function UsersSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Billing</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Services</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            {Array.from({ length: 7 }).map((__, cellIndex) => (
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

export function UsersEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No users match this search</EmptyTitle>
        <EmptyDescription>
          Try a different name, email, role, or account ID.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

type MetricCardProps = {
  title: string
  value: string
  helper: string
}

export function MetricCard({ title, value, helper }: MetricCardProps) {
  return (
    <Card className="border-border/60 bg-card/95">
      <CardContent>
        <div className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {title}
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
      </CardContent>
    </Card>
  )
}
