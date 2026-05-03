import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Package02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function formatPrice(priceUsdCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(priceUsdCents / 100)
}

export function getDefaultPricingOption(
  pricingOptions: Array<{
    id: number
    durationDays: number
    priceUsdCents: number
    isActive: boolean
  }>,
  defaultPricingId: number | null
) {
  return (
    pricingOptions.find((option) => option.id === defaultPricingId) ??
    pricingOptions.find((option) => option.isActive) ??
    pricingOptions[0] ??
    null
  )
}

export function PlansSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Resources</TableHead>
          <TableHead>Pricing Options</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-44" />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PlansEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No plans found</EmptyTitle>
        <EmptyDescription>
          Create plans and pricing options to start offering subscriptions.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
