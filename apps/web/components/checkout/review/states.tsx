import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, CreditCardIcon, Invoice03Icon } from "@hugeicons/core-free-icons"

import { webPaths } from "@/lib/paths"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function MissingOrderReference() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Missing order reference</EmptyTitle>
          <EmptyDescription>
            Review requires a valid order id. Please select a plan first.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={webPaths.home}>
          <Button>
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back to plans
          </Button>
        </Link>
      </Empty>
    </main>
  )
}

export function CheckoutReviewLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-18 w-full" />
        <Skeleton className="h-18 w-full" />
      </CardContent>
    </Card>
  )
}

export function CheckoutReviewError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
      <AlertTitle>Unable to load order details</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

export function CheckoutOrderNotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyTitle>Order not found</EmptyTitle>
        <EmptyDescription>
          This order is unavailable or does not belong to your account.
        </EmptyDescription>
      </EmptyHeader>
      <Link href={webPaths.home}>
        <Button>Browse active plans</Button>
      </Link>
    </Empty>
  )
}

export function InvoiceFlowAlert({
  invoiceNumber,
  invoiceExpiresAt,
}: {
  invoiceNumber?: string
  invoiceExpiresAt?: string
}) {
  if (invoiceNumber && invoiceExpiresAt) {
    return (
      <Alert>
        <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
        <AlertTitle>Existing unpaid invoice found</AlertTitle>
        <AlertDescription>
          Invoice {invoiceNumber} is open until{" "}
          {new Date(invoiceExpiresAt).toLocaleString()}. Continuing will reuse
          this invoice.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
      <AlertTitle>Invoice-first flow</AlertTitle>
      <AlertDescription>
        Your invoice has already been created and is currently unpaid. Continue
        when you are ready to pay.
      </AlertDescription>
    </Alert>
  )
}
