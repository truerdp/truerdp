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
  if (status === "pending") {
    return (
      <span className="text-sm text-muted-foreground">
        Awaiting confirmation
      </span>
    )
  }

  if (status === "confirmed") {
    return <Badge variant="default">Paid</Badge>
  }

  return <span className="text-sm text-destructive">Failed</span>
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
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className={
                tx.status === "pending" ? "bg-yellow-50/60" : undefined
              }
            >
              <TableCell className="font-mono text-sm">{tx.id}</TableCell>
              <TableCell>₹{tx.amount}</TableCell>
              <TableCell>{formatMethod(tx.method)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(tx.status)}>
                  {formatStatus(tx.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(tx.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{getActionContent(tx.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
