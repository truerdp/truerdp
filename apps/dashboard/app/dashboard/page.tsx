"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import InstanceTable, { type Instance } from "@/components/instance-table"
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

export default function DashboardPage() {
  const { data, isLoading } = useQuery<Instance[]>({
    queryKey: ["instances"],
    queryFn: () => api("/instances"),
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My Instances</h1>
      {isLoading ? (
        <InstanceTableSkeleton />
      ) : (
        <InstanceTable instances={data ?? []} />
      )}
    </div>
  )
}
