import { HugeiconsIcon } from "@hugeicons/react"
import { TaskDone02Icon } from "@hugeicons/core-free-icons"

import { AdminUserLink } from "@/components/admin-user-link"
import type { AdminTransaction } from "@/hooks/use-transactions"
import {
  formatAmount,
  formatDateTime,
  getStatusBadgeVariant,
  getUserDisplayName,
} from "@/components/admin-transactions/helpers"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type AdminTransactionsTableProps = {
  transactions: AdminTransaction[]
  isConfirming: boolean
  onConfirm: (transactionId: number) => void
}

export function AdminTransactionsTable({
  transactions,
  isConfirming,
  onConfirm,
}: AdminTransactionsTableProps) {
  return (
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
                  <span className="font-mono text-sm">#{transaction.id}</span>
                  <span className="text-xs text-muted-foreground">
                    {transaction.reference}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <AdminUserLink
                  userId={transaction.user.id}
                  primary={getUserDisplayName(transaction.user)}
                  secondary={transaction.user.email}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{transaction.plan.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {transaction.pricing.durationDays} days
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatAmount(transaction.amount, transaction.invoice.currency)}
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
                  transaction.method !== "dodo_checkout" &&
                  transaction.method !== "coingate_checkout" && (
                    <Button
                      size="sm"
                      onClick={() => onConfirm(transaction.id)}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
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
                  (transaction.method === "dodo_checkout" ||
                    transaction.method === "coingate_checkout") && (
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
  )
}
