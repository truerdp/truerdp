import { format } from "date-fns"

import type { InvoiceSummary } from "@/hooks/use-invoices"

export function formatMethod(method: InvoiceSummary["transaction"]["method"]) {
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

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

export function getInvoiceStatusVariant(
  status: InvoiceSummary["status"]
): "default" | "outline" | "secondary" {
  if (status === "paid") {
    return "default"
  }

  if (status === "expired") {
    return "secondary"
  }

  return "outline"
}

export function getInvoiceUrgency(invoice: InvoiceSummary): {
  label: string
  variant: "outline" | "secondary" | "destructive"
} | null {
  if (invoice.status !== "unpaid" && invoice.status !== "expired") {
    return null
  }

  if (!invoice.expiresAt) {
    return null
  }

  const expiresAt = new Date(invoice.expiresAt).getTime()
  if (Number.isNaN(expiresAt)) {
    return null
  }

  const now = Date.now()

  if (invoice.status === "expired" || expiresAt < now) {
    return { label: "Overdue", variant: "destructive" }
  }

  const daysRemaining = Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 0) {
    return { label: "Expires today", variant: "secondary" }
  }

  return {
    label: `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`,
    variant: "outline",
  }
}

export function isInvoicePayable(invoice: InvoiceSummary) {
  if (invoice.status !== "unpaid") {
    return false
  }

  if (invoice.order.status !== "pending_payment") {
    return false
  }

  if (!invoice.expiresAt) {
    return true
  }

  const expiresAt = new Date(invoice.expiresAt).getTime()
  return !Number.isNaN(expiresAt) && expiresAt >= Date.now()
}
