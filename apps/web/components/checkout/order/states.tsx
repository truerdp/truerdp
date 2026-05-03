import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon, CreditCardIcon } from "@hugeicons/core-free-icons"

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
            Checkout requires a valid order id. Please select a plan first.
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

export function CheckoutOrderLoading() {
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

export function CheckoutOrderError({ message }: { message: string }) {
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
