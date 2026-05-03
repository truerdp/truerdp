import { format } from "date-fns"

import type {
  UserDetailsData,
  UserDetailsUser,
  UserInstance,
  UserInvoice,
  UserTransaction,
} from "./types"

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

export function formatCurrency(amount: number, currency: string) {
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

export function formatMethod(
  method:
    | "upi"
    | "usdt_trc20"
    | "dodo_checkout"
    | "coingate_checkout"
    | null
    | undefined
) {
  if (!method) {
    return "-"
  }

  switch (method) {
    case "upi":
      return "UPI"
    case "usdt_trc20":
      return "USDT (TRC20)"
    case "dodo_checkout":
      return "Dodo Checkout"
    case "coingate_checkout":
      return "CoinGate"
    default:
      return String(method).replaceAll("_", " ")
  }
}

export function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ")
}

export function getDisplayName(user: UserDetailsUser) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()
  return fullName || user.email
}

export function getInitials(user: UserDetailsUser) {
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.trim()
  return initials ? initials.toUpperCase() : user.email.slice(0, 2).toUpperCase()
}

export function getRoleVariant(role: UserDetailsData["user"]["role"]) {
  switch (role) {
    case "admin":
      return "default"
    case "operator":
      return "outline"
    default:
      return "secondary"
  }
}

export function getInstanceStatusVariant(
  status: UserInstance["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
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

export function getInvoiceStatusVariant(
  status: UserInvoice["status"]
): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

export function getTransactionStatusVariant(
  status: UserTransaction["status"]
): "default" | "secondary" | "destructive" {
  if (status === "confirmed") {
    return "default"
  }

  if (status === "pending") {
    return "secondary"
  }

  return "destructive"
}

export function getSuccessRate(
  confirmedTransactions: number,
  totalTransactions: number
) {
  if (totalTransactions === 0) {
    return "0%"
  }

  return `${Math.round((confirmedTransactions / totalTransactions) * 100)}%`
}
