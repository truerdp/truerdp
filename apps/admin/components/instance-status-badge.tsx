"use client"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export function ExpiringSoonStatusBadge({
  daysUntilExpiry,
}: {
  daysUntilExpiry: number
}) {
  if (daysUntilExpiry === 0) {
    return <Badge variant="destructive">Expires Today</Badge>
  }

  if (daysUntilExpiry === 1) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "bg-yellow-500/15 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300"
        )}
      >
        Expires Tomorrow
      </Badge>
    )
  }

  return <Badge variant="secondary">Expiring Soon</Badge>
}

export function ExpiredStatusBadge({
  daysSinceExpiry,
}: {
  daysSinceExpiry: number
}) {
  if (daysSinceExpiry <= 1) {
    return <Badge variant="secondary">Recently Expired</Badge>
  }

  return <Badge variant="destructive">Overdue</Badge>
}
