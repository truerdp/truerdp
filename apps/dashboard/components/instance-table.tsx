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
import InstancesEmptyState from "@/components/instances-empty-state"
import { dashboardPaths } from "@/lib/paths"

export interface Instance {
  id: number
  status:
    | "pending"
    | "provisioning"
    | "active"
    | "expired"
    | "termination_pending"
    | "terminated"
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
    case "active":
      return "secondary"
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

function formatStatus(status: Instance["status"]): string {
  return status.replaceAll("_", " ")
}

function formatExpiryDate(dateString: string | null): string {
  if (!dateString) return "-"
  return format(new Date(dateString), "MMM d, yyyy")
}

function isExpired(dateString: string | null): boolean {
  if (!dateString) return false

  const date = new Date(dateString)
  return !Number.isNaN(date.getTime()) && date < new Date()
}

export default function InstanceTable({ instances }: InstanceTableProps) {
  if (instances.length === 0) {
    return (
      <div className="rounded-md border">
        <InstancesEmptyState />
      </div>
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
                {formatStatus(instance.status)}
              </Badge>
            </TableCell>
            <TableCell className="font-mono">
              {instance.ipAddress ?? "-"}
            </TableCell>
            <TableCell
              className={
                isExpired(instance.expiryDate) ? "text-destructive" : undefined
              }
            >
              {formatExpiryDate(instance.expiryDate)}
            </TableCell>
            <TableCell>
              <Link
                href={dashboardPaths.instanceDetail(instance.id)}
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                })}
                aria-label={`View instance ${instance.id}`}
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
