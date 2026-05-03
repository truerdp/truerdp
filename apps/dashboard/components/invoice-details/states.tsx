import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, CreditCardIcon } from "@hugeicons/core-free-icons"

import { dashboardPaths } from "@/lib/paths"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter, CardHeader } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function MissingInvoiceReference() {
  return (
    <Empty className="max-w-3xl border">
      <EmptyHeader>
        <EmptyTitle>Missing invoice reference</EmptyTitle>
        <EmptyDescription>
          Open an invoice from the invoices list to view its full details.
        </EmptyDescription>
      </EmptyHeader>
      <Link href={dashboardPaths.invoices}>
        <Button variant="outline">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Back to invoices
        </Button>
      </Link>
    </Empty>
  )
}

export function InvoiceNotFound() {
  return (
    <Empty className="max-w-3xl border">
      <EmptyHeader>
        <EmptyTitle>Invoice not found</EmptyTitle>
        <EmptyDescription>
          This invoice may belong to another account or no longer exist.
        </EmptyDescription>
      </EmptyHeader>
      <Link href={dashboardPaths.invoices}>
        <Button variant="outline">
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Back to invoices
        </Button>
      </Link>
    </Empty>
  )
}

export function InvoiceDetailsError() {
  return (
    <Alert variant="destructive" className="max-w-3xl">
      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
      <AlertTitle>Failed to load invoice details</AlertTitle>
      <AlertDescription>
        Try refreshing the page or reopening this invoice from the list.
      </AlertDescription>
    </Alert>
  )
}

export function InvoiceDetailsSkeleton() {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-24" />
      </CardFooter>
    </Card>
  )
}
