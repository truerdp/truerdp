import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, FilterIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"

export type InvoiceStatusFilter = "all" | "unpaid" | "paid" | "expired"
export type TransactionStatusFilter =
  | "all"
  | "none"
  | "pending"
  | "confirmed"
  | "failed"
export type MethodFilter =
  | "all"
  | "none"
  | "upi"
  | "usdt_trc20"
  | "dodo_checkout"
  | "coingate_checkout"

type InvoiceFilterControlsProps = {
  searchValue: string
  invoiceStatusFilter: InvoiceStatusFilter
  transactionStatusFilter: TransactionStatusFilter
  methodFilter: MethodFilter
  activeFacetCount: number
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onInvoiceStatusChange: (value: InvoiceStatusFilter) => void
  onTransactionStatusChange: (value: TransactionStatusFilter) => void
  onMethodChange: (value: MethodFilter) => void
  onReset: () => void
}

export function InvoiceFilterControls({
  searchValue,
  invoiceStatusFilter,
  transactionStatusFilter,
  methodFilter,
  activeFacetCount,
  hasActiveFilters,
  onSearchChange,
  onInvoiceStatusChange,
  onTransactionStatusChange,
  onMethodChange,
  onReset,
}: InvoiceFilterControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full sm:max-w-sm">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search invoice, tx ref, user, plan"
        />
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Sheet>
          <SheetTrigger render={<Button type="button" variant="outline" />}>
            <HugeiconsIcon
              icon={FilterIcon}
              strokeWidth={2}
              className="size-4"
              data-icon="inline-start"
            />
            Filters
            {activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}
          </SheetTrigger>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Invoice Filters</SheetTitle>
              <SheetDescription>
                Narrow down invoices by payment and transaction attributes.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Invoice status</p>
                <Select
                  value={invoiceStatusFilter}
                  onValueChange={(value) =>
                    onInvoiceStatusChange(value as InvoiceStatusFilter)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Invoice status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All invoices</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Transaction status</p>
                <Select
                  value={transactionStatusFilter}
                  onValueChange={(value) =>
                    onTransactionStatusChange(value as TransactionStatusFilter)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Transaction status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All transactions</SelectItem>
                    <SelectItem value="none">No transaction</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Method</p>
                <Select
                  value={methodFilter}
                  onValueChange={(value) => onMethodChange(value as MethodFilter)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="none">No method</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="dodo_checkout">Dodo Checkout</SelectItem>
                    <SelectItem value="coingate_checkout">CoinGate</SelectItem>
                    <SelectItem value="usdt_trc20">USDT (TRC20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <SheetFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={!hasActiveFilters}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Clear all
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={!hasActiveFilters}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Clear
        </Button>
      </div>
    </div>
  )
}
