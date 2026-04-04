"use client"

import InstanceTable from "@/components/instance-table"
import { useInstances } from "@/hooks/use-instances"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function InstanceTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function InstancesPage() {
  const { data, isLoading } = useInstances()
  const instances = data ?? []

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Instances</h1>
        <p className="text-sm text-muted-foreground">
          Manage all your RDP instances in one place.
        </p>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <InstanceTableSkeleton />
        ) : (
          <InstanceTable instances={instances} />
        )}
      </div>
    </section>
  )
}
