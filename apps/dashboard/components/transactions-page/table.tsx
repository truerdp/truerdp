import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CpuIcon,
  ExternalDriveIcon,
  LinkSquare02Icon,
  RamMemoryIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"

import { formatAmount } from "@/lib/format"
import { dashboardPaths } from "@/lib/paths"
import type { Transaction } from "@/hooks/use-transactions"
import {
  formatMethod,
  formatSafeDate,
  formatStatus,
  getStatusVariant,
} from "@/components/transactions-page/helpers"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

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

type TransactionsTableProps = {
  transactions: Transaction[]
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
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
            className={tx.status === "pending" ? "bg-yellow-50/60" : undefined}
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
                    <HugeiconsIcon icon={CpuIcon} size={14} strokeWidth={2} />
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
                    href={dashboardPaths.instanceDetail(tx.instance.id)}
                    className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <HugeiconsIcon icon={LinkSquare02Icon} size={14} strokeWidth={2} />
                    Instance #{tx.instance.id}
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">{formatAmount(tx.amount)}</TableCell>
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
  )
}
