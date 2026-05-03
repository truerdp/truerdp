import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, DollarCircleIcon } from "@hugeicons/core-free-icons"

import type { BillingOrder } from "@/hooks/use-order"
import { formatAmount } from "@/lib/format"
import type { PaymentMethod } from "@/hooks/use-checkout-order"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

interface PaymentCardProps {
  order: BillingOrder
  method: PaymentMethod
  setMethod: (method: PaymentMethod) => void
  hasBillingDetails: boolean
  isSubmitting: boolean
  existingPendingTransaction: {
    invoice: {
      invoiceNumber: string
      expiresAt: string
    }
  } | null
  onCreateTransaction: () => void
}

export function CheckoutPaymentCard({
  order,
  method,
  setMethod,
  hasBillingDetails,
  isSubmitting,
  existingPendingTransaction,
  onCreateTransaction,
}: PaymentCardProps) {
  return (
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
              This order is currently in {order.status} state and cannot create
              a new transaction.
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
          <SummaryRow label="Plan" value={order.plan.name} />
          <SummaryRow
            label="Compute"
            value={`${order.plan.cpu} vCPU / ${order.plan.ram} GB RAM / ${order.plan.storage} GB`}
          />
          <SummaryRow
            label="Subtotal"
            value={formatAmount(order.invoice?.subtotal ?? order.pricing.priceUsdCents)}
          />
          {order.invoice?.discount ? (
            <SummaryRow
              label={`Discount${
                order.invoice.couponCode ? ` (${order.invoice.couponCode})` : ""
              }`}
              value={`-${formatAmount(order.invoice.discount)}`}
            />
          ) : null}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total due</span>
            <span className="text-lg font-semibold">
              {formatAmount(order.invoice?.totalAmount ?? order.pricing.priceUsdCents)}
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
                selected === "coingate_checkout" ||
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
            <ToggleGroupItem value="coingate_checkout">
              CoinGate (Crypto)
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
              You will be redirected to a secure payment page supporting cards,
              wallets, and domestic/international methods.
            </AlertDescription>
          </Alert>
        ) : method === "coingate_checkout" ? (
          <Alert>
            <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
            <AlertTitle>Crypto checkout via CoinGate</AlertTitle>
            <AlertDescription>
              You will be redirected to CoinGate to pay with supported
              cryptocurrencies. Confirmation syncs automatically.
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
            isSubmitting || order.status !== "pending_payment" || !hasBillingDetails
          }
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {existingPendingTransaction
            ? "Continue with unpaid invoice"
            : "Create transaction"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>{value}</span>
      </div>
      <Separator className="my-3" />
    </>
  )
}
