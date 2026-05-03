import { format } from "date-fns"

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

export function getExpiringSoonRowClassName(daysUntilExpiry: number) {
  if (daysUntilExpiry === 0) {
    return "bg-destructive/10 hover:bg-destructive/15"
  }

  if (daysUntilExpiry === 1) {
    return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/20"
  }

  return undefined
}

export function getExpiredRowClassName(daysSinceExpiry: number) {
  if (daysSinceExpiry >= 3) {
    return "bg-destructive/10 hover:bg-destructive/15"
  }

  if (daysSinceExpiry >= 1) {
    return "bg-yellow-500/10 hover:bg-yellow-500/15 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/20"
  }

  return undefined
}
