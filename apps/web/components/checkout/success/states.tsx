import Link from "next/link"

import { webPaths } from "@/lib/paths"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"

export function MissingTransactionReference() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Missing transaction reference</EmptyTitle>
          <EmptyDescription>
            Start checkout from a plan to generate a transaction.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={webPaths.home}>
          <Button>Back to plans</Button>
        </Link>
      </Empty>
    </main>
  )
}

export function CheckoutSuccessLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </CardContent>
      </Card>
    </main>
  )
}

export function TransactionNotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Transaction not found</EmptyTitle>
          <EmptyDescription>
            The transaction may belong to a different user or is not loaded yet.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={webPaths.home}>
          <Button>Choose a new plan</Button>
        </Link>
      </Empty>
    </main>
  )
}
