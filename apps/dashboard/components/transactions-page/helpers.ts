import { format } from "date-fns"

import type { Transaction } from "@/hooks/use-transactions"

export function formatMethod(method: Transaction["method"]) {
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

export function formatStatus(status: Transaction["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function getStatusVariant(
  status: Transaction["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "pending":
      return "outline"
    case "confirmed":
      return "default"
    case "failed":
      return "destructive"
    default:
      return "secondary"
  }
}

export function formatSafeDate(date: string) {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? "-" : format(d, "MMM d, yyyy p")
}
