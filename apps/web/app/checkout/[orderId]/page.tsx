"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
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
import { formatAmount } from "@/lib/format"
import { useOrder } from "@/hooks/use-order"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { webPaths } from "@/lib/paths"

type PaymentMethod = "dodo_checkout" | "upi" | "usdt_trc20"

interface CreateTransactionResponse {
  id: number
  gatewayRedirectUrl?: string | null
}

export default function CheckoutOrderPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("dodo_checkout")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderId = Number(params.orderId ?? "")
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0

  const {
    data: order,
    isLoading,
    error,
  } = useOrder(hasValidOrderId ? orderId : null)
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfile()
  const { data: transactions } = useTransactions()

  const hasBillingDetails = order
    ? Boolean((order as unknown as { billingDetails?: unknown }).billingDetails)
    : false

  useEffect(() => {
    if (!hasValidOrderId) {
      return
    }

    if (!isProfileLoading && isProfileError) {
      const redirectPath = webPaths.checkoutOrder(orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
    }
  }, [hasValidOrderId, isProfileError, isProfileLoading, orderId, router])

  const existingPendingTransaction = useMemo(() => {
    if (!transactions || !hasValidOrderId) {
      return null
    }

    const now = Date.now()

    return (
      transactions.find((transaction) => {
        const expiresAt = new Date(transaction.invoice.expiresAt).getTime()

        return (
          transaction.order.id === orderId &&
          transaction.status === "pending" &&
          transaction.invoice.status === "unpaid" &&
          !Number.isNaN(expiresAt) &&
          expiresAt >= now
        )
      }) ?? null
    )
  }, [hasValidOrderId, orderId, transactions])

  async function onCreateTransaction() {
    if (!order || order.status !== "pending_payment") {
      return
    }

    if (!profile) {
      const redirectPath = webPaths.checkoutOrder(order.orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
      return
    }

    try {
      setIsSubmitting(true)
      const transaction = await clientApi<CreateTransactionResponse>(
        "/transactions",
        {
          method: "POST",
          body: {
            orderId: order.orderId,
            method,
          },
        }
      )

      if (transaction.gatewayRedirectUrl) {
        // Hosted checkout – redirect user to Dodo Payments
        window.location.assign(transaction.gatewayRedirectUrl)
        return
      }

      toast.success(
        existingPendingTransaction
          ? "Continuing with your existing unpaid invoice"
          : "Transaction created"
      )
      router.push(
        `${webPaths.checkoutSuccess}?orderId=${order.orderId}&transactionId=${transaction.id}`
      )
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

  if (!hasValidOrderId) {
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <div className="mb-4">
        <Link href={webPaths.checkoutReviewOrder(orderId)}>
          <Button variant="ghost" size="sm">
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back to invoice review
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
          <AlertTitle>Unable to load order details</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && !order ? (
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
      ) : null}

      {!isLoading && !error && order ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              Choose payment method to create or reuse your payment attempt.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{order.plan.name}</Badge>
              <Badge variant="outline">{order.pricing.durationDays} days</Badge>
              <Badge variant="outline">Order #{order.orderId}</Badge>
            </div>

            {order.status !== "pending_payment" ? (
              <Alert variant="destructive">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Order cannot be paid</AlertTitle>
                <AlertDescription>
                  This order is currently in {order.status} state and cannot
                  create a new transaction.
                </AlertDescription>
              </Alert>
            ) : null}

            {existingPendingTransaction ? (
              <Alert>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Existing unpaid invoice found</AlertTitle>
                <AlertDescription>
                  Invoice {existingPendingTransaction.invoice.invoiceNumber} is
                  still open until{" "}
                  {new Date(
                    existingPendingTransaction.invoice.expiresAt
                  ).toLocaleString()}
                  . Continuing will reuse that invoice.
                </AlertDescription>
              </Alert>
            ) : null}

            {!hasBillingDetails ? (
              <Alert variant="destructive">
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Billing details required</AlertTitle>
                <AlertDescription>
                  Please go back to invoice review and complete billing details
                  before creating a transaction.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{order.plan.name}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Compute</span>
                <span>
                  {order.plan.cpu} vCPU / {order.plan.ram} GB RAM /{" "}
                  {order.plan.storage} GB
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">
                  {formatAmount(order.pricing.priceUsdCents)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Choose payment method</p>
              <ToggleGroup
                value={[method]}
                onValueChange={(value) => {
                  const selected = value[0] as PaymentMethod | undefined
                  if (
                    selected === "dodo_checkout" ||
                    selected === "upi" ||
                    selected === "usdt_trc20"
                  ) {
                    setMethod(selected)
                  }
                }}
              >
                <ToggleGroupItem value="dodo_checkout">
                  Dodo Checkout (Recommended)
                </ToggleGroupItem>
                <ToggleGroupItem value="upi">UPI</ToggleGroupItem>
                <ToggleGroupItem value="usdt_trc20">USDT TRC20</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {method === "dodo_checkout" ? (
              <Alert>
                <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
                <AlertTitle>Secure hosted checkout</AlertTitle>
                <AlertDescription>
                  You will be redirected to a secure payment page supporting
                  cards, wallets, and domestic/international methods. Upon
                  completion, you will return here automatically.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
                <AlertTitle>Manual confirmation flow</AlertTitle>
                <AlertDescription>
                  Creates a pending transaction for admin review.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={onCreateTransaction}
              disabled={
                isSubmitting ||
                order.status !== "pending_payment" ||
                !hasBillingDetails
              }
            >
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {existingPendingTransaction
                ? "Continue with unpaid invoice"
                : "Create transaction"}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  )
}
