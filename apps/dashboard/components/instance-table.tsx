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
    | "suspended"
    | "expired"
    | "termination_pending"
    | "terminated"
    | "failed"
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
    case "suspended":
      return "destructive"
    case "pending":
    case "provisioning":
      return "outline"
    case "expired":
      return "secondary"
    case "termination_pending":
    case "terminated":
    case "failed":
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

function isExpiringSoon(
  dateString: string | null,
  now: Date,
  threeDaysFromNow: Date
): boolean {
  if (!dateString) return false

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date >= now && date <= threeDaysFromNow
}

export default function InstanceTable({ instances }: InstanceTableProps) {
  if (instances.length === 0) {
    return <InstancesEmptyState />
  }

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

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
        {instances.map((instance) => {
          const rowIsExpiringSoon = isExpiringSoon(
            instance.expiryDate,
            now,
            threeDaysFromNow
          )

          return (
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
                  isExpired(instance.expiryDate)
                    ? "text-destructive"
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <span>{formatExpiryDate(instance.expiryDate)}</span>
                  {rowIsExpiringSoon ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-50 text-amber-900"
                    >
                      Expiring soon
                    </Badge>
                  ) : null}
                </div>
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
          )
        })}
      </TableBody>
    </Table>
  )
}
