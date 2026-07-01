import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select"

export type OrderStatusControlValue =
  | "all"
  | "pending_payment"
  | "processing"
  | "completed"
  | "cancelled"
export type InvoiceStatusControlValue =
  | "all"
  | "none"
  | "unpaid"
  | "paid"
  | "expired"
export type OrderKindControlValue = "all" | "new_purchase" | "renewal"

type OrderFilterControlsProps = {
  searchValue: string
  orderStatusFilter: OrderStatusControlValue
  invoiceStatusFilter: InvoiceStatusControlValue
  kindFilter: OrderKindControlValue
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onOrderStatusChange: (value: OrderStatusControlValue) => void
  onInvoiceStatusChange: (value: InvoiceStatusControlValue) => void
  onKindChange: (value: OrderKindControlValue) => void
  onReset: () => void
}

export function OrderFilterControls({
  searchValue,
  orderStatusFilter,
  invoiceStatusFilter,
  kindFilter,
  hasActiveFilters,
  onSearchChange,
  onOrderStatusChange,
  onInvoiceStatusChange,
  onKindChange,
  onReset,
}: OrderFilterControlsProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="w-full xl:max-w-sm">
        <Input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search order, invoice, user, plan"
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <NativeSelect
          value={orderStatusFilter}
          onChange={(event) =>
            onOrderStatusChange(event.target.value as OrderStatusControlValue)
          }
          aria-label="Order status"
          className="w-full sm:w-44"
        >
          <NativeSelectOption value="all">All orders</NativeSelectOption>
          <NativeSelectOption value="pending_payment">
            Pending payment
          </NativeSelectOption>
          <NativeSelectOption value="processing">Processing</NativeSelectOption>
          <NativeSelectOption value="completed">Completed</NativeSelectOption>
          <NativeSelectOption value="cancelled">Cancelled</NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          value={invoiceStatusFilter}
          onChange={(event) =>
            onInvoiceStatusChange(
              event.target.value as InvoiceStatusControlValue
            )
          }
          aria-label="Invoice status"
          className="w-full sm:w-40"
        >
          <NativeSelectOption value="all">All invoices</NativeSelectOption>
          <NativeSelectOption value="none">No invoice</NativeSelectOption>
          <NativeSelectOption value="unpaid">Unpaid</NativeSelectOption>
          <NativeSelectOption value="paid">Paid</NativeSelectOption>
          <NativeSelectOption value="expired">Expired</NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          value={kindFilter}
          onChange={(event) =>
            onKindChange(event.target.value as OrderKindControlValue)
          }
          aria-label="Order kind"
          className="w-full sm:w-40"
        >
          <NativeSelectOption value="all">All types</NativeSelectOption>
          <NativeSelectOption value="new_purchase">
            New purchase
          </NativeSelectOption>
          <NativeSelectOption value="renewal">Renewal</NativeSelectOption>
        </NativeSelect>
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
