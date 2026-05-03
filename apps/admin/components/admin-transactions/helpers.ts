import { format } from "date-fns"

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

export function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency.toUpperCase()}`
  }
}

export function getStatusBadgeVariant(status: "pending" | "confirmed" | "failed") {
  if (status === "pending") {
    return "secondary"
  }

  if (status === "confirmed") {
    return "outline"
  }

  return "destructive"
}

export function getUserDisplayName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  return fullName || user.email
}
