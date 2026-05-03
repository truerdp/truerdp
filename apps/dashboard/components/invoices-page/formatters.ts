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
      return String(method).toUpperCase()
  }
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
