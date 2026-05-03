import { format } from "date-fns"

import type { InstanceDetailsData } from "@/hooks/use-instance"
import type { InstanceTransaction } from "@/hooks/use-instance-transactions"

export type BillingStatus = "active" | "renewal_pending" | "expired"

export function formatDate(value: string | null): string {
  if (!value) return "-"
  return format(new Date(value), "MMM d, yyyy")
}

export function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

export function getStatusVariant(
  status: InstanceDetailsData["status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "suspended":
      return "destructive"
    case "pending":
    case "provisioning":
      return "outline"
    case "expired":
      return "secondary"
    case "termination_pending":
    case "terminated":
      return "destructive"
    default:
      return "secondary"
  }
}

export function getBillingStatusVariant(
  status: BillingStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "renewal_pending":
      return "outline"
    case "expired":
      return "destructive"
    default:
      return "secondary"
  }
}

export function getInstanceBillingState(
  data: InstanceDetailsData | undefined,
  transactions: InstanceTransaction[]
) {
  const hasPendingRenewal = transactions.some((tx) => tx.status === "pending")
  const pendingTransactions = transactions.filter((tx) => tx.status === "pending")
  const latestPendingTransaction = pendingTransactions[0]

  const canShowRenew = data?.status === "active" || data?.status === "expired"
  const canRenew = canShowRenew && !hasPendingRenewal
  const isExpired =
    data?.status === "expired" ||
    Boolean(data?.expiryDate && new Date(data.expiryDate) < new Date())

  const billingStatus: BillingStatus = hasPendingRenewal
    ? "renewal_pending"
    : isExpired
      ? "expired"
      : "active"

  return {
    hasPendingRenewal,
    latestPendingTransaction,
    canShowRenew,
    canRenew,
    isExpired,
    billingStatus,
  }
}
