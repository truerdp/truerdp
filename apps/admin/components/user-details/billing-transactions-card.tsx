import Link from "next/link"

import { CreditCardIcon } from "@hugeicons/core-free-icons"

import { adminPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  CompactField,
  SectionEmpty,
  formatCurrency,
  formatDateTime,
  formatMethod,
  formatStatusLabel,
  getTransactionStatusVariant,
} from "./helpers"
import type { UserDetailsData } from "./types"

export function BillingTransactionsCard({ data }: { data: UserDetailsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          Payment attempts, outcomes, and linked infrastructure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.transactions.length === 0 ? (
          <SectionEmpty
            title="No transactions yet"
            description="Payments and retries will populate this section automatically."
            icon={CreditCardIcon}
          />
        ) : (
          <div className="space-y-3">
            <div className="space-y-3 md:hidden">
              {data.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">
                        {transaction.reference || `txn_${transaction.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Invoice {transaction.invoice.invoiceNumber}
                      </div>
                    </div>
                    <Badge variant={getTransactionStatusVariant(transaction.status)}>
                      {formatStatusLabel(transaction.status)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <CompactField label="Plan" value={transaction.plan.name} />
                    <CompactField
                      label="Amount"
                      value={formatCurrency(
                        transaction.amount,
                        transaction.invoice.currency
                      )}
                    />
                    <CompactField
                      label="Method"
                      value={formatMethod(transaction.method)}
                    />
                    <CompactField
                      label="Linked Instance"
                      value={
                        transaction.instance
                          ? `#${transaction.instance.id} • ${
                              transaction.instance.ipAddress || "No IP"
                            }`
                          : "-"
                      }
                    />
                    <CompactField
                      label="Created"
                      value={formatDateTime(transaction.createdAt)}
                      className="text-muted-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linked Instance</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm">
                            {transaction.reference || `txn_${transaction.id}`}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Invoice {transaction.invoice.invoiceNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {transaction.plan.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(
                          transaction.amount,
                          transaction.invoice.currency
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatMethod(transaction.method)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTransactionStatusVariant(transaction.status)}>
                          {formatStatusLabel(transaction.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.instance ? (
                          <Link
                            href={adminPaths.instanceDetails(transaction.instance.id)}
                            className="text-sm font-medium transition-colors hover:text-primary"
                          >
                            #{transaction.instance.id} •{" "}
                            {transaction.instance.ipAddress || "No IP"}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
