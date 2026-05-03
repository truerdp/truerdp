import Link from "next/link"
import { format } from "date-fns"

import { buildWebCheckoutReviewUrl } from "@/lib/auth"
import { dashboardPaths } from "@/lib/paths"
import { formatAmount } from "@/lib/format"
import { type InvoiceSummary } from "@/hooks/use-invoices"
import { formatMethod, getInvoiceStatusVariant, isInvoicePayable } from "@/components/invoices-page/formatters"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

type InvoicesTableProps = {
  invoices: InvoiceSummary[]
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Paid</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <div className="flex flex-col">
                <Link
                  href={dashboardPaths.invoiceDetail(invoice.id)}
                  className="font-mono text-sm underline-offset-2 hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
                <span className="text-xs text-muted-foreground">
                  TX {invoice.transaction.reference || "-"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{invoice.plan.name}</span>
                <span className="text-xs text-muted-foreground">
                  {invoice.plan.durationDays} days ·{" "}
                  {invoice.plan.kind === "renewal" ? "Renewal" : "New purchase"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm">
              {formatAmount(invoice.totalAmount, invoice.currency)}
            </TableCell>
            <TableCell>
              <Badge
                variant={getInvoiceStatusVariant(invoice.status)}
                className="uppercase"
              >
                {invoice.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">
              {formatMethod(invoice.transaction.method)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDateTime(invoice.createdAt)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDateTime(invoice.paidAt)}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={dashboardPaths.invoiceDetail(invoice.id)}>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
                {isInvoicePayable(invoice) ? (
                  <Button
                    size="sm"
                    onClick={() =>
                      window.location.assign(
                        buildWebCheckoutReviewUrl(invoice.order.id)
                      )
                    }
                  >
                    Pay now
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
