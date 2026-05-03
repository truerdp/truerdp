import { format } from "date-fns"

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

export function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

export function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency}`
  }
}

export function getDisplayName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  return fullName || user.email
}

export function getRoleVariant(role: "user" | "operator" | "admin") {
  switch (role) {
    case "admin":
      return "default"
    case "operator":
      return "outline"
    default:
      return "secondary"
  }
}
