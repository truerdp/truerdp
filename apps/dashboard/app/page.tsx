"use client"

import InstanceTable from "@/components/instance-table"
import TransactionsEmptyState from "@/components/transactions-empty-state"
import { useInstances } from "@/hooks/use-instances"
import { useTransactions } from "@/hooks/use-transactions"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  ClockAlertIcon,
  CreditCardIcon,
  FullScreenIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { buttonVariants } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import Link from "next/link"
import { dashboardPaths } from "@/lib/paths"

function InstanceTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-14" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useInstances()
  const { data: transactions } = useTransactions()
  const instances = data ?? []
  const transactionsList = transactions ?? []

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

  const pendingTransactions = transactionsList.filter(
    (transaction) => transaction.status === "pending"
  ).length

  const recentTransactions = [...transactionsList]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)

  const formatAmount = (amount: number) => `₹${amount.toLocaleString()}`

  const formatSafeDate = (dateString: string) => {
    const date = new Date(dateString)
    return Number.isNaN(date.getTime()) ? "-" : format(date, "MMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={ServerStack01Icon} size={16} strokeWidth={2} />
            Active Instances
          </div>
          <p className="text-2xl font-semibold">{activeInstances}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Alert02Icon} size={16} strokeWidth={2} />
            Expiring Soon
          </div>
          <p className="text-2xl font-semibold">{expiringSoonCount}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={2} />
            Pending Transactions
          </div>
          <p className="text-2xl font-semibold">{pendingTransactions}</p>
        </div>
      </div>

      {expiringSoonCount > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <HugeiconsIcon icon={ClockAlertIcon} size={18} strokeWidth={2} />
          <AlertTitle className="text-amber-900">
            {expiringSoonCount} instance{expiringSoonCount > 1 ? "s" : ""}{" "}
            expiring soon
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Renew or review your instances before they expire.
          </AlertDescription>
          <AlertAction>
            <Link
              href={dashboardPaths.instances}
              className={buttonVariants({
                variant: "outline",
                size: "default",
              })}
            >
              Manage
            </Link>
          </AlertAction>
        </Alert>
      )}

      {pendingTransactions > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <HugeiconsIcon icon={CreditCardIcon} size={18} strokeWidth={2} />
          <AlertTitle className="text-amber-900">
            You have {pendingTransactions} pending transaction
            {pendingTransactions > 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Review payment details and confirmation status in your transaction
            history.
          </AlertDescription>
          <AlertAction>
            <Link
              href={dashboardPaths.transactions}
              className={buttonVariants({
                variant: "outline",
                size: "default",
              })}
            >
              Review
            </Link>
          </AlertAction>
        </Alert>
      )}

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-sm">
                      #{transaction.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.status}
                    </TableCell>
                    <TableCell>
                      {formatSafeDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  )
}
