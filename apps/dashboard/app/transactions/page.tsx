"use client"

import TransactionsEmptyState from "@/components/transactions-empty-state"
import { useTransactions } from "@/hooks/use-transactions"
import { TransactionsTableSkeleton } from "@/components/transactions-page/skeleton"
import { TransactionsTable } from "@/components/transactions-page/table"

function TransactionsHeader() {
  return (
    <>
      <h1 className="text-2xl font-bold">Transactions</h1>
      <p className="text-sm text-muted-foreground">
        Your completed and pending payments are listed below.
      </p>
    </>
  )
}

export default function TransactionsPage() {
  const { data: transactions, isLoading, isError } = useTransactions()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="rounded-lg border">
          <TransactionsTableSkeleton />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">
        Failed to load transactions.
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <TransactionsHeader />
        </div>
        <div className="rounded-lg border">
          <TransactionsEmptyState />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <TransactionsHeader />
      <div className="rounded-lg border">
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  )
}
