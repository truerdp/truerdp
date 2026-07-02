"use client"

import Link from "next/link"
import { useParams } from "next/navigation"

import { AdminUserLink } from "@/components/admin-user-link"
import {
  formatAmount,
  formatDateTime,
  getStatusBadgeVariant,
  getUserDisplayName,
} from "@/components/admin-transactions/helpers"
import { useTransaction } from "@/hooks/use-transactions"
import { adminPaths } from "@/lib/paths"
import { BackButton } from "@workspace/ui/components/back-button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-right text-sm">{value}</span>
      </div>
      <Separator />
    </>
  )
}

export default function AdminTransactionDetailsPage() {
  const { id } = useParams()
  const transactionId = Number(String(id ?? ""))
  const hasValidTransactionId =
    Number.isInteger(transactionId) && transactionId > 0
  const {
    data: transaction,
    isLoading,
    isError,
  } = useTransaction(transactionId, hasValidTransactionId)

  if (!hasValidTransactionId) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Missing transaction reference</EmptyTitle>
          <EmptyDescription>
            Open a transaction from the transactions list.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />
  }

  if (isError || !transaction) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Transaction not found</EmptyTitle>
          <EmptyDescription>This transaction could not be loaded.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <BackButton
        render={<Link href={adminPaths.transactions} />}
        className="self-start"
      >
        Back to transactions
      </BackButton>

      <Card>
        <CardHeader>
          <CardTitle>Transaction #{transaction.id}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={getStatusBadgeVariant(transaction.status)}
              className="uppercase"
            >
              {transaction.status}
            </Badge>
            <Badge variant="outline" className="uppercase">
              {transaction.method}
            </Badge>
            <Link href={adminPaths.orderDetails(transaction.order.id)}>
              <Badge variant="outline">Order #{transaction.order.id}</Badge>
            </Link>
            <Link href={adminPaths.invoiceDetails(transaction.invoice.id)}>
              <Badge variant="outline">
                Invoice {transaction.invoice.invoiceNumber}
              </Badge>
            </Link>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Customer</span>
            <AdminUserLink
              userId={transaction.user.id}
              primary={getUserDisplayName(transaction.user)}
              secondary={transaction.user.email}
            />
          </div>
          <Separator />
          <Row
            label="Amount"
            value={formatAmount(
              transaction.amount,
              transaction.invoice.currency
            )}
          />
          <Row label="Plan" value={transaction.plan.name} />
          <Row
            label="Duration"
            value={`${transaction.pricing.durationDays} days`}
          />
          <Row label="Reference" value={transaction.reference ?? "-"} />
          <Row label="Created" value={formatDateTime(transaction.createdAt)} />
          <Row
            label="Confirmed"
            value={formatDateTime(transaction.confirmedAt)}
          />
          <Row label="Failure reason" value={transaction.failureReason ?? "-"} />
          <Row label="Crypto hash" value={transaction.cryptoTxId ?? "-"} />
        </CardContent>
      </Card>
    </div>
  )
}
