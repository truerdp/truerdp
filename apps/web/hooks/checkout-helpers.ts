import type { Transaction } from "@/hooks/use-transactions"

export function findExistingPendingTransaction(
  transactions: Transaction[] | undefined,
  orderId: number,
  hasValidOrderId: boolean
) {
  if (!transactions || !hasValidOrderId) {
    return null
  }

  const now = Date.now()

  return (
    transactions.find((transaction) => {
      if (
        transaction.order?.id !== orderId ||
        transaction.status !== "pending" ||
        transaction.invoice?.status !== "unpaid" ||
        !transaction.invoice.expiresAt
      ) {
        return false
      }

      const expiresAt = new Date(transaction.invoice.expiresAt).getTime()

      return (
        !Number.isNaN(expiresAt) &&
        expiresAt >= now
      )
    }) ?? null
  )
}
