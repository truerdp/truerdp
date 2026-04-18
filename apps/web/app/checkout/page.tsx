"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { api } from "@workspace/api"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  CreditCardIcon,
  DollarCircleIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { getAuthToken } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { usePlans } from "@/hooks/use-plans"
import { webPaths } from "@/lib/paths"

type PaymentMethod = "upi" | "usdt_trc20"

interface CreateTransactionResponse {
  id: number
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, isLoading, error } = usePlans()
  const [method, setMethod] = useState<PaymentMethod>("upi")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const planPricingId = Number(searchParams.get("planPricingId") ?? "")
  const hasValidPlanPricingId =
    Number.isInteger(planPricingId) && planPricingId > 0

  const selectedPricing = useMemo(() => {
    if (!data || !hasValidPlanPricingId) {
      return null
    }

    for (const plan of data) {
      const option = plan.pricingOptions.find(
        (pricing) => pricing.id === planPricingId
      )
      if (option) {
        return {
          plan,
          pricing: option,
        }
      }
    }

    return null
  }, [data, hasValidPlanPricingId, planPricingId])

  async function onCreateTransaction() {
    if (!selectedPricing) {
      return
    }

    if (!getAuthToken()) {
      const redirect = `${webPaths.checkout}?planPricingId=${selectedPricing.pricing.id}`
      router.push(`${webPaths.login}?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    try {
      setIsSubmitting(true)
      const transaction = await api<CreateTransactionResponse>(
        "/transactions",
        {
          method: "POST",
          body: JSON.stringify({
            planPricingId: selectedPricing.pricing.id,
            method,
          }),
        }
      )

      toast.success("Transaction created")
      router.push(`${webPaths.checkoutSuccess}?transactionId=${transaction.id}`)
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create transaction"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasValidPlanPricingId) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Missing plan selection</EmptyTitle>
            <EmptyDescription>
              Choose a plan and pricing option before starting checkout.
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-4">
        <Link href={webPaths.home}>
          <Button variant="ghost" size="sm">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Change plan
          </Button>
        </Link>
      </div>

      {isLoading ? (
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
      ) : null}

      {!isLoading && error ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
          <AlertTitle>Unable to load plan details</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && !selectedPricing ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Plan option not found</EmptyTitle>
            <EmptyDescription>
              The selected pricing option is not active anymore. Please choose
              another one.
            </EmptyDescription>
          </EmptyHeader>
          <Link href={webPaths.home}>
            <Button>Browse active plans</Button>
          </Link>
        </Empty>
      ) : null}

      {!isLoading && !error && selectedPricing ? (
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
            <CardDescription>
              Create an invoice and pending transaction for admin confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{selectedPricing.plan.name}</Badge>
              <Badge variant="outline">
                {selectedPricing.pricing.durationDays} days
              </Badge>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{selectedPricing.plan.name}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Compute</span>
                <span>
                  {selectedPricing.plan.cpu} vCPU / {selectedPricing.plan.ram}{" "}
                  GB RAM / {selectedPricing.plan.storage} GB
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">
                  {formatAmount(selectedPricing.pricing.price)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Choose payment method</p>
              <ToggleGroup
                value={[method]}
                onValueChange={(value) => {
                  const selected = value[0]
                  if (selected === "upi" || selected === "usdt_trc20") {
                    setMethod(selected)
                  }
                }}
              >
                <ToggleGroupItem value="upi">UPI</ToggleGroupItem>
                <ToggleGroupItem value="usdt_trc20">USDT TRC20</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Alert>
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
              <AlertTitle>Manual confirmation flow</AlertTitle>
              <AlertDescription>
                No payment gateway is integrated yet. This creates a pending
                transaction for admin review.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button onClick={onCreateTransaction} disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              Create transaction
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  )
}

function CheckoutPageFallback() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
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
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageFallback />}>
      <CheckoutPageContent />
    </Suspense>
  )
}
