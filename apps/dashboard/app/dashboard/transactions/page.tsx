"use client"

import { format } from "date-fns"
import { useTransactions, type Transaction } from "@/hooks/use-transactions"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CpuIcon,
  ExternalDriveIcon,
  LinkSquare02Icon,
  RamMemoryIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"

function TransactionsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function formatMethod(method: Transaction["method"]) {
  return method === "upi" ? "UPI" : "USDT (TRC20)"
}

function formatStatus(status: Transaction["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getStatusVariant(
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

function getActionContent(status: Transaction["status"]) {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pending</Badge>

    case "confirmed":
      return <Badge variant="default">Paid</Badge>

    case "failed":
      return <Badge variant="destructive">Failed</Badge>
  }
}

export function formatAmount(amount: number) {
  return `₹${amount.toLocaleString()}`
}

function formatSafeDate(date: string) {
  const d = new Date(date)
  return isNaN(d.getTime()) ? "-" : format(d, "MMM d, yyyy p")
}

export default function TransactionsPage() {
  const { data: transactions, isLoading, isError } = useTransactions()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <TransactionsTableSkeleton />
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
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="rounded-md border p-6 text-sm text-muted-foreground">
          No transactions found
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.map((tx) => (
              <TableRow
                key={tx.id}
                className={
                  tx.status === "pending" ? "bg-yellow-50/60" : undefined
                }
              >
                <TableCell className="font-mono text-sm">#{tx.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <HugeiconsIcon
                        icon={ServerStack01Icon}
                        size={16}
                        className="text-muted-foreground"
                        strokeWidth={2}
                      />
                      <span>{tx.plan.name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={CpuIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        {tx.plan.cpu} CPU
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={RamMemoryIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        {tx.plan.ram}GB RAM
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={ExternalDriveIcon}
                          size={14}
                          strokeWidth={2}
                        />
                        {tx.plan.storage}GB SSD
                      </span>
                    </div>

                    {tx.instance ? (
                      <Link
                        href={`/dashboard/instances/${tx.instance.id}`}
                        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <HugeiconsIcon
                          icon={LinkSquare02Icon}
                          size={14}
                          strokeWidth={2}
                        />
                        Instance #{tx.instance.id}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatAmount(tx.amount)}
                </TableCell>
                <TableCell>{formatMethod(tx.method)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(tx.status)}>
                    {formatStatus(tx.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatSafeDate(tx.createdAt)}</TableCell>
                <TableCell>{getActionContent(tx.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
