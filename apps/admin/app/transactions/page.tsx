"use client"

import { useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  CreditCardIcon,
  TaskDone02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { useTransactions } from "@/hooks/use-transactions"
import { useConfirmTransaction } from "@/hooks/use-confirm-transaction"
import { ProvisionInstanceDialog } from "@/components/provision-instance-dialog"

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency.toUpperCase()}`
  }
}

function PendingTransactionsSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Transaction</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TransactionsEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No transactions found</EmptyTitle>
        <EmptyDescription>
          Transactions will appear here when users create payments.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function getStatusBadgeVariant(status: "pending" | "confirmed" | "failed") {
  if (status === "pending") {
    return "secondary"
  }

  if (status === "confirmed") {
    return "outline"
  }

  return "destructive"
}

function getUserDisplayName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()

  if (fullName) {
    return fullName
  }

  return user.email
}

export default function AdminTransactionsPage() {
  const { data, isLoading, isError, error } = useTransactions()
  const confirmMutation = useConfirmTransaction()
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(
    null
  )

  const transactions = data ?? []

  const handleConfirmTransaction = async (transactionId: number) => {
    try {
      const response = await confirmMutation.mutateAsync(transactionId)

      // If this is a new order (not a renewal) and instance was created, provision it
      if (response.kind === "new_purchase" && response.instance?.id) {
        setSelectedInstanceId(response.instance.id)
        setProvisionDialogOpen(true)
      }
    } catch (err) {
      // Error toast is handled in the mutation hook
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Review all transactions with pending ones prioritized for action.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <PendingTransactionsSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load transactions."}</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-lg border">
          <TransactionsEmpty />
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm">
                        #{transaction.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.reference}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {getUserDisplayName(transaction.user)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.user.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {transaction.plan.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.pricing.durationDays} days
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatAmount(
                      transaction.amount,
                      transaction.invoice.currency
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase">
                      {transaction.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(transaction.status)}
                      className="uppercase"
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(transaction.createdAt)}
                  </TableCell>
                  <TableCell>
                    {transaction.status === "pending" &&
                      transaction.method !== "dodo_checkout" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleConfirmTransaction(transaction.id)
                          }
                          disabled={confirmMutation.isPending}
                        >
                          {confirmMutation.isPending ? (
                            <Spinner data-icon="inline-start" />
                          ) : (
                            <HugeiconsIcon
                              icon={TaskDone02Icon}
                              strokeWidth={2}
                              data-icon="inline-start"
                            />
                          )}
                          Confirm
                        </Button>
                      )}
                    {transaction.status === "pending" &&
                      transaction.method === "dodo_checkout" && (
                        <Badge variant="outline" className="uppercase">
                          Auto via webhook
                        </Badge>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ProvisionInstanceDialog
        open={provisionDialogOpen}
        instanceId={selectedInstanceId || 0}
        onOpenChange={setProvisionDialogOpen}
      />
    </section>
  )
}
