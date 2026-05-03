import { AdminUserLink } from "@/components/admin-user-link"
import { AdminPaginationControls } from "@/components/admin-pagination-controls"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import type {
  AdminInvoiceListResponse,
  AdminInvoiceSummary,
} from "@/hooks/use-invoices"
import {
  formatAmount,
  formatDateTime,
  formatMethod,
  getInvoiceStatusBadgeVariant,
  getTransactionStatusBadgeVariant,
  getUserDisplayName,
} from "@/components/invoices-page-parts"

type AdminInvoicesTableProps = {
  invoices: AdminInvoiceSummary[]
  pagination: AdminInvoiceListResponse["pagination"] | undefined
  pageStart: number
  pageEnd: number
  onPageChange: (value: number) => void
  onPageSizeChange: (value: number) => void
}

export function AdminInvoicesTable({
  invoices,
  pagination,
  pageStart,
  pageEnd,
  onPageChange,
  onPageSizeChange,
}: AdminInvoicesTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Invoice Status</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{invoice.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      TX {invoice.transaction.reference || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <AdminUserLink
                    userId={invoice.user.id}
                    primary={getUserDisplayName(invoice.user)}
                    secondary={invoice.user.email}
                  />
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
                    variant={getInvoiceStatusBadgeVariant(invoice.status)}
                    className="uppercase"
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getTransactionStatusBadgeVariant(
                      invoice.transaction.status
                    )}
                    className="uppercase"
                  >
                    {invoice.transaction.status ?? "none"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatMethod(invoice.transaction.method)}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {formatDateTime(invoice.createdAt)}
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">
                  {formatDateTime(invoice.paidAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        {pagination ? (
          <AdminPaginationControls
            page={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            pageStart={pageStart}
            pageEnd={pageEnd}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}
      </div>
    </div>
  )
}
