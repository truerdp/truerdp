"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { FullScreenIcon } from "@hugeicons/core-free-icons"

import InstanceTable from "@/components/instance-table"
import TransactionsEmptyState from "@/components/transactions-empty-state"
import { useInstances } from "@/hooks/use-instances"
import { useTransactions } from "@/hooks/use-transactions"
import { dashboardPaths } from "@/lib/paths"
import { InstanceTableSkeleton } from "@/components/dashboard-home/instance-table-skeleton"
import { getDashboardOverview } from "@/components/dashboard-home/overview"
import { RecentTransactionsTable } from "@/components/dashboard-home/recent-transactions-table"
import { StatusAlerts } from "@/components/dashboard-home/status-alerts"
import { SummaryCards } from "@/components/dashboard-home/summary-cards"
import { buttonVariants } from "@workspace/ui/components/button"

export default function DashboardPage() {
  const { data, isLoading } = useInstances()
  const { data: transactions } = useTransactions()
  const instances = data ?? []
  const transactionsList = transactions ?? []

  const {
    activeInstances,
    expiringSoonCount,
    pendingTransactions,
    recentTransactions,
  } = getDashboardOverview(instances, transactionsList)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <SummaryCards
        activeInstances={activeInstances}
        expiringSoonCount={expiringSoonCount}
        pendingTransactions={pendingTransactions}
      />

      <StatusAlerts
        expiringSoonCount={expiringSoonCount}
        pendingTransactions={pendingTransactions}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Your Instances</h2>
          <Link
            href={dashboardPaths.instances}
            className={buttonVariants({ variant: "link" })}
          >
            <HugeiconsIcon
              icon={FullScreenIcon}
              size={16}
              strokeWidth={2}
              data-icon="inline-start"
            />
            View All
          </Link>
        </div>
        <div className="rounded-lg border">
          {isLoading ? (
            <InstanceTableSkeleton />
          ) : (
            <InstanceTable instances={instances} />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <Link
            href={dashboardPaths.transactions}
            className={buttonVariants({ variant: "link" })}
          >
            <HugeiconsIcon
              icon={FullScreenIcon}
              size={16}
              strokeWidth={2}
              data-icon="inline-start"
            />
            View All
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="rounded-lg border">
            <TransactionsEmptyState />
          </div>
        ) : (
          <div className="rounded-lg border">
            <RecentTransactionsTable transactions={recentTransactions} />
          </div>
        )}
      </section>
    </div>
  )
}
