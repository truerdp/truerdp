import { CreditCardIcon } from "@hugeicons/core-free-icons"

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
  formatStatusLabel,
  getInvoiceStatusVariant,
} from "./helpers"
import type { UserDetailsData } from "./types"

export function BillingInvoicesCard({ data }: { data: UserDetailsData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>
          Invoice ledger with latest transaction attachment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.invoices.length === 0 ? (
          <SectionEmpty
            title="No invoices yet"
            description="Invoices will appear here once the user starts checkout."
            icon={CreditCardIcon}
          />
        ) : (
          <div className="space-y-3">
            <div className="space-y-3 md:hidden">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="rounded-3xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        Order #{invoice.order.id}
                      </div>
                    </div>
                    <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                      {formatStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <CompactField
                      label="Plan"
                      value={`${invoice.plan.name} • ${invoice.plan.durationDays} days`}
                    />
                    <CompactField
                      label="Amount"
                      value={formatCurrency(invoice.totalAmount, invoice.currency)}
                    />
                    <CompactField
                      label="Transaction"
                      value={invoice.transaction.reference || "-"}
                    />
                    <CompactField
                      label="Created"
                      value={formatDateTime(invoice.createdAt)}
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
                    <TableHead>Invoice</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            Order #{invoice.order.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {invoice.plan.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.plan.durationDays} days •{" "}
                            {formatStatusLabel(invoice.plan.kind)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                          {formatStatusLabel(invoice.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.transaction.reference || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(invoice.createdAt)}
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
