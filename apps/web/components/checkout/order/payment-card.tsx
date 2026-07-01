import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import {
  CreditCardIcon,
  DollarCircleIcon,
  Copy01Icon,
  InformationCircleIcon,
  Tick01Icon,
  PaypalIcon,
  BitcoinIcon,
  UsdtIcon,
} from "@hugeicons/core-free-icons"
import { useState } from "react"
import { toast } from "sonner"

import type { BillingOrder } from "@/hooks/use-order"
import { formatAmount } from "@/lib/format"
import type {
  CheckoutPaymentSettings,
  PaymentMethod,
} from "@/hooks/use-payment-settings"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
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
import { Label } from "@workspace/ui/components/label"
import { Input } from "@workspace/ui/components/input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@workspace/ui/components/field"

interface PaymentCardProps {
  order: BillingOrder
  method: PaymentMethod | null
  setMethod: (method: PaymentMethod | null) => void
  paymentSettings: CheckoutPaymentSettings
  txId: string
  setTxId: (txId: string) => void
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
  paymentSettings,
  txId,
  setTxId,
  hasBillingDetails,
  isSubmitting,
  existingPendingTransaction,
  onCreateTransaction,
}: PaymentCardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const trc20Settings = paymentSettings.methods.usdt_trc20
  const paymentMethodOptions = [
    {
      id: "usdt_trc20",
      value: "usdt_trc20",
      title: "USDT TRC20",
      description: "Crypto Payment (Recommended)",
      icon: UsdtIcon,
      enabled: paymentSettings.methods.usdt_trc20.enabled,
    },
    {
      id: "dodo_checkout",
      value: "dodo_checkout",
      title: "Card / Wallets",
      description: "Dodo Checkout",
      icon: CreditCardIcon,
      enabled: paymentSettings.methods.dodo_checkout.enabled,
    },
    {
      id: "coingate_checkout",
      value: "coingate_checkout",
      title: "Other Crypto",
      description: "CoinGate Checkout",
      icon: BitcoinIcon,
      enabled: paymentSettings.methods.coingate_checkout.enabled,
    },
    {
      id: "paypal_checkout",
      value: "paypal_checkout",
      title: "PayPal",
      description: "Hosted Checkout",
      icon: PaypalIcon,
      enabled: paymentSettings.methods.paypal_checkout.enabled,
    },
    {
      id: "upi",
      value: "upi",
      title: "UPI",
      description: "Manual Payment",
      icon: DollarCircleIcon,
      enabled: paymentSettings.methods.upi.enabled,
    },
  ].filter((option) => option.enabled)

  const handleCopyAddress = () => {
    if (!trc20Settings.walletAddress) {
      toast.error("TRC20 wallet address is unavailable")
      return
    }

    navigator.clipboard.writeText(trc20Settings.walletAddress)
    toast.success("Wallet address copied to clipboard")
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const orderSubtotal = order.invoice?.subtotal ?? order.pricing.priceUsdCents
  const totalAmount = order.invoice?.totalAmount ?? order.pricing.priceUsdCents

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Payment Details</CardTitle>
        <CardDescription>
          Review your order summary and choose a payment method to proceed.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-8">
        {/* Order Summary Section */}
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="px-3 py-1 text-sm font-medium"
            >
              {order.items.length} line{order.items.length === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
              Order #{order.orderId}
            </Badge>
          </div>

          <div className="flex flex-col">
            {order.items.map((item) => (
              <SummaryRow
                key={item.id}
                label={`${item.planName} x ${item.quantity}`}
                value={formatAmount(item.lineTotalUsdCents)}
              />
            ))}
            <SummaryRow label="Subtotal" value={formatAmount(orderSubtotal)} />
            {order.invoice?.discount ? (
              <SummaryRow
                label={`Discount${
                  order.invoice.couponCode
                    ? ` (${order.invoice.couponCode})`
                    : ""
                }`}
                value={`-${formatAmount(order.invoice.discount)}`}
              />
            ) : null}
            <div className="mt-2 flex items-center justify-between rounded-md bg-muted/50 px-2 py-4">
              <span className="text-base font-semibold text-foreground">
                Total due
              </span>
              <span className="text-xl font-bold tracking-tight text-primary">
                {formatAmount(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* State Alerts */}
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

        {paymentMethodOptions.length === 0 ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
            <AlertTitle>No payment methods available</AlertTitle>
            <AlertDescription>
              Checkout is temporarily unavailable because no payment methods are
              currently enabled.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Payment Method Selection */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold tracking-tight">
            Choose payment method
          </h3>
          <RadioGroup
            value={method ?? ""}
            onValueChange={(value) => setMethod(value as PaymentMethod)}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            {paymentMethodOptions.map((option) => (
              <PaymentMethodCard
                key={option.id}
                id={option.id}
                value={option.value}
                title={option.title}
                description={option.description}
                icon={option.icon}
                selected={method === option.value}
              />
            ))}
          </RadioGroup>
        </div>

        {/* Selected Method Details */}
        <div className="pt-2">
          {method === "dodo_checkout" ? (
            <Alert className="bg-muted/30">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
              <AlertTitle>Secure hosted checkout</AlertTitle>
              <AlertDescription>
                You will be redirected to a secure payment page supporting
                cards, wallets, and domestic/international methods.
              </AlertDescription>
            </Alert>
          ) : method === "coingate_checkout" ? (
            <Alert className="bg-muted/30">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
              <AlertTitle>Crypto checkout via CoinGate</AlertTitle>
              <AlertDescription>
                You will be redirected to CoinGate to pay with supported
                cryptocurrencies. Confirmation syncs automatically.
              </AlertDescription>
            </Alert>
          ) : method === "paypal_checkout" ? (
            <Alert className="bg-muted/30">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
              <AlertTitle>PayPal hosted checkout</AlertTitle>
              <AlertDescription>
                You will be redirected to PayPal to approve the payment. TrueRDP
                captures it securely after approval.
              </AlertDescription>
            </Alert>
          ) : method === "upi" ? (
            <Alert className="bg-muted/30">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} />
              <AlertTitle>Manual UPI payment</AlertTitle>
              <AlertDescription>
                Complete the transfer using the shared UPI instructions, then
                wait for admin confirmation.
              </AlertDescription>
            </Alert>
          ) : method === "usdt_trc20" ? (
            <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
              <Alert>
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  strokeWidth={2}
                  className="text-blue-500"
                />
                <AlertTitle>
                  Crypto payments are verified within 24 hours after submission.
                </AlertTitle>
              </Alert>

              <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
                <div className="mx-auto shrink-0 rounded-xl border bg-white p-2 shadow-sm md:mx-0">
                  {trc20Settings.qrCodeImageUrl ? (
                    <Image
                      src={trc20Settings.qrCodeImageUrl}
                      alt="USDT TRC20 QR Code"
                      width={180}
                      height={180}
                      className="rounded-lg"
                    />
                  ) : null}
                </div>

                <div className="flex w-full flex-1 flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Amount to send
                    </Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatAmount(totalAmount)} USDT
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-sm text-muted-foreground">
                      Wallet Address (TRC20)
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-md bg-muted px-4 py-2.5 font-mono text-sm font-semibold break-all">
                        {trc20Settings.walletAddress}
                      </code>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={handleCopyAddress}
                        title="Copy to clipboard"
                      >
                        <HugeiconsIcon
                          icon={isCopied ? Tick01Icon : Copy01Icon}
                          strokeWidth={2}
                          size={18}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="txId"
                      className="text-sm text-muted-foreground"
                    >
                      Transaction Hash (TxID){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="txId"
                      placeholder="Paste your transaction hash here..."
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      className="h-11 font-mono text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="px-6 pt-2 pb-6">
        <Button
          size="lg"
          className="h-12 w-full text-base font-semibold"
          onClick={onCreateTransaction}
          disabled={
            isSubmitting ||
            !method ||
            order.status !== "pending_payment" ||
            !hasBillingDetails ||
            (method === "usdt_trc20" && txId.trim().length === 0)
          }
        >
          {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
          {existingPendingTransaction
            ? "Continue with unpaid invoice"
            : method === "usdt_trc20"
              ? "Confirm Payment Sent"
              : "Proceed to pay"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="flex items-center justify-between py-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}</span>
      </div>
      <Separator className="bg-border/50" />
    </>
  )
}

function PaymentMethodCard({
  id,
  value,
  title,
  description,
  icon,
  selected,
}: {
  id: string
  value: string
  title: string
  description: string
  icon: typeof CreditCardIcon
  selected: boolean
}) {
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <HugeiconsIcon
          icon={icon}
          strokeWidth={2}
          className={selected ? "text-primary" : "text-muted-foreground"}
          size={24}
        />
        <FieldContent>
          <FieldTitle>{title}</FieldTitle>
          <FieldDescription>{description}</FieldDescription>
        </FieldContent>
        <RadioGroupItem value={value} id={id} />
      </Field>
    </FieldLabel>
  )
}
