"use client"

import Link from "next/link"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { buttonVariants } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@workspace/ui/components/empty"
import { HugeiconsIcon } from "@hugeicons/react"
import { ServerStack01Icon } from "@hugeicons/core-free-icons"

export interface Instance {
  id: string
  status: "running" | "stopped" | "pending" | "error"
  ipAddress: string | null
  expiryDate: string | null
}

interface InstanceTableProps {
  instances: Instance[]
}

function getStatusVariant(
  status: Instance["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "default"
    case "stopped":
      return "secondary"
    case "pending":
      return "outline"
    case "error":
      return "destructive"
    default:
      return "secondary"
  }
}

function formatExpiryDate(dateString: string | null): string {
  if (!dateString) return "-"
  return format(new Date(dateString), "MMM d, yyyy")
}

export default function InstanceTable({ instances }: InstanceTableProps) {
  if (instances.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon
              icon={ServerStack01Icon}
              color="text-muted-foreground"
            />
          </EmptyMedia>
          <EmptyTitle>No instances</EmptyTitle>
          <EmptyDescription>
            You don&apos;t have any instances yet. Create one to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

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
        {instances.map((instance) => (
          <TableRow key={instance.id}>
            <TableCell className="font-mono text-sm">{instance.id}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(instance.status)}>
                {instance.status}
              </Badge>
            </TableCell>
            <TableCell className="font-mono">
              {instance.ipAddress ?? "-"}
            </TableCell>
            <TableCell>{formatExpiryDate(instance.expiryDate)}</TableCell>
            <TableCell>
              <Link
                href={`/dashboard/instances/${instance.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
