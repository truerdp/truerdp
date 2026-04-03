"use client"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export type StatusBadgeStatus = "pending" | "active" | "expired"

interface StatusBadgeProps {
  status: StatusBadgeStatus
  className?: string
}

const statusStyles: Record<StatusBadgeStatus, string> = {
  pending:
    "border-yellow-300 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  active:
    "border-green-300 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300",
  expired:
    "border-red-300 bg-red-100 text-red-800 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300",
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusStyles[status], className)}
    >
      {status}
    </Badge>
  )
}
