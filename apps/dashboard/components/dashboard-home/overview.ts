import { format } from "date-fns"

import type { Instance } from "@/hooks/use-instances"
import type { Transaction } from "@/hooks/use-transactions"

export function getDashboardOverview(
  instances: Instance[],
  transactions: Transaction[]
) {
  const activeInstances = instances.filter(
    (instance) => instance.status === "active"
  ).length

  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const expiringSoonCount = instances.filter((instance) => {
    if (!instance.expiryDate) return false
    const expiry = new Date(instance.expiryDate)

    if (Number.isNaN(expiry.getTime())) return false

    return expiry >= now && expiry <= threeDaysFromNow
  }).length

  const pendingTransactions = transactions.filter(
    (transaction) => transaction.status === "pending"
  ).length

  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  return {
    activeInstances,
    expiringSoonCount,
    pendingTransactions,
    recentTransactions,
  }
}

export function formatSafeDate(dateString: string) {
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy")
}
