"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { toast } from "sonner"
import { clientApi } from "@workspace/api"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  ArrowRight01Icon,
  CreditCardIcon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"
import { formatAmount } from "@/lib/format"
import { useOrder, type OrderBillingDetails } from "@/hooks/use-order"
import { useProfile } from "@/hooks/use-profile"
import { useTransactions } from "@/hooks/use-transactions"
import { webPaths } from "@/lib/paths"

interface BillingFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  companyName: string
  taxId: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

const billingFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Billing email is required")
    .email("Valid billing email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  companyName: z.string().trim(),
  taxId: z.string().trim(),
  addressLine1: z.string().trim().min(1, "Address line 1 is required"),
  addressLine2: z.string().trim(),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  postalCode: z.string().trim().min(1, "Postal code is required"),
  country: z.string().trim().min(1, "Country is required"),
})

const emptyBillingForm: BillingFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  companyName: "",
  taxId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
}

function toBillingFormValues(
  details: OrderBillingDetails | null | undefined,
  fallbackProfile: { firstName: string; lastName: string; email: string } | null
): BillingFormValues {
  if (details) {
    return {
      firstName: details.firstName,
      lastName: details.lastName,
      email: details.email,
      phone: details.phone ?? "",
      companyName: details.companyName ?? "",
      taxId: details.taxId ?? "",
      addressLine1: details.addressLine1,
      addressLine2: details.addressLine2 ?? "",
      city: details.city,
      state: details.state,
      postalCode: details.postalCode,
      country: details.country,
    }
  }

  if (fallbackProfile) {
    return {
      ...emptyBillingForm,
      firstName: fallbackProfile.firstName,
      lastName: fallbackProfile.lastName,
      email: fallbackProfile.email,
    }
  }

  return emptyBillingForm
}

function buildBillingPayload(values: BillingFormValues): OrderBillingDetails {
  const normalizeRequired = (value: string) => value.trim()
  const normalizeOptional = (value: string) => {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  return {
    firstName: normalizeRequired(values.firstName),
    lastName: normalizeRequired(values.lastName),
    email: normalizeRequired(values.email).toLowerCase(),
    phone: normalizeRequired(values.phone),
    companyName: normalizeOptional(values.companyName),
    taxId: normalizeOptional(values.taxId),
    addressLine1: normalizeRequired(values.addressLine1),
    addressLine2: normalizeOptional(values.addressLine2),
    city: normalizeRequired(values.city),
    state: normalizeRequired(values.state),
    postalCode: normalizeRequired(values.postalCode),
    country: normalizeRequired(values.country),
  }
}

export default function CheckoutReviewPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const orderId = Number(params.orderId ?? "")
  const hasValidOrderId = Number.isInteger(orderId) && orderId > 0
  const [isSavingBilling, setIsSavingBilling] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [isUpdatingCoupon, setIsUpdatingCoupon] = useState(false)
  const {
    register,
    reset,
    setError,
    clearErrors,
    trigger,
    getValues,
    control,
    formState: { errors },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: emptyBillingForm,
    mode: "onChange",
  })
  const watchedBillingForm = useWatch({ control })

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

  useEffect(() => {
    if (!order) {
      return
    }

    reset(
      toBillingFormValues(
        order.billingDetails,
        profile
          ? {
              firstName: profile.firstName,
              lastName: profile.lastName,
              email: profile.email,
            }
          : null
      )
    )
    clearErrors("root")
  }, [
    clearErrors,
    order?.billingDetails,
    order?.orderId,
    profile?.email,
    profile?.firstName,
    profile?.lastName,
    reset,
  ])

  useEffect(() => {
    if (!hasValidOrderId) {
      return
    }

    if (!isProfileLoading && isProfileError) {
      const redirectPath = webPaths.checkoutReviewOrder(orderId)
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

  const billingPayload = useMemo(
    () =>
      buildBillingPayload({
        ...emptyBillingForm,
        ...watchedBillingForm,
      }),
    [watchedBillingForm]
  )

  const hasSavedBillingDetails = Boolean(order?.billingDetails)
  const hasUnsavedBillingChanges = useMemo(() => {
    if (!order?.billingDetails) {
      return true
    }

    return (
      JSON.stringify(order.billingDetails) !== JSON.stringify(billingPayload)
    )
  }, [billingPayload, order?.billingDetails])

  const persistBillingDetails = async (
    values: BillingFormValues
  ): Promise<boolean> => {
    if (!order) {
      return false
    }

    try {
      clearErrors("root")
      setIsSavingBilling(true)

      await clientApi(`/orders/${order.orderId}/billing`, {
        method: "PATCH",
        body: buildBillingPayload(values),
      })

      await queryClient.invalidateQueries({
        queryKey: ["order", order.orderId],
      })

      toast.success("Billing details saved")
      return true
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to save billing details"
      setError("root", { message })
      toast.error(message)
      return false
    } finally {
      setIsSavingBilling(false)
    }
  }

  async function saveBillingDetails() {
    const isValid = await trigger()

    if (!isValid) {
      toast.error("Please complete required billing details")
      return false
    }

    return persistBillingDetails(getValues())
  }

  async function updateCoupon(code: string | null) {
    if (!order) {
      return
    }

    try {
      setIsUpdatingCoupon(true)
      const response = await clientApi<{ order: unknown; message: string }>(
        `/orders/${order.orderId}/coupon`,
        {
          method: "PATCH",
          body: { code },
        }
      )

      await queryClient.invalidateQueries({
        queryKey: ["order", order.orderId],
      })
      toast.success(response.message)

      if (!code) {
        setCouponCode("")
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to update coupon"
      toast.error(message)
    } finally {
      setIsUpdatingCoupon(false)
    }
  }

  async function proceedToPayment() {
    if (!order) {
      return
    }

    if (!profile) {
      const redirectPath = webPaths.checkoutReviewOrder(order.orderId)
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
      return
    }

    if (!hasSavedBillingDetails || hasUnsavedBillingChanges) {
      const saved = await saveBillingDetails()

      if (!saved) {
        return
      }
    }

    router.push(webPaths.checkoutOrder(order.orderId))
  }

  if (!hasValidOrderId) {
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
            <CardTitle className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
              Invoice Review
            </CardTitle>
            <CardDescription>
              Review your generated invoice before choosing payment method.
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
                <AlertTitle>Order is no longer payable</AlertTitle>
                <AlertDescription>
                  This order is currently in {order.status} state.
                </AlertDescription>
              </Alert>
            ) : null}

            {existingPendingTransaction ? (
              <Alert>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                <AlertTitle>Existing unpaid invoice found</AlertTitle>
                <AlertDescription>
                  Invoice {existingPendingTransaction.invoice.invoiceNumber} is
                  open until{" "}
                  {new Date(
                    existingPendingTransaction.invoice.expiresAt
                  ).toLocaleString()}
                  . Continuing will reuse this invoice.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
                <AlertTitle>Invoice-first flow</AlertTitle>
                <AlertDescription>
                  Your invoice has already been created and is currently unpaid.
                  Continue when you are ready to pay.
                </AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl border p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Billing information</p>
                  <p className="text-xs text-muted-foreground">
                    This data is saved with the order and used for invoicing.
                  </p>
                </div>
                <Badge
                  variant={hasSavedBillingDetails ? "secondary" : "outline"}
                >
                  {hasSavedBillingDetails ? "Saved" : "Required"}
                </Badge>
              </div>

              <FieldGroup>
                <Field data-invalid={!!errors.firstName}>
                  <FieldLabel htmlFor="billing-first-name">
                    First name *
                  </FieldLabel>
                  <Input
                    id="billing-first-name"
                    {...register("firstName")}
                    placeholder="First name"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName ? (
                    <FieldError>{errors.firstName.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.lastName}>
                  <FieldLabel htmlFor="billing-last-name">
                    Last name *
                  </FieldLabel>
                  <Input
                    id="billing-last-name"
                    {...register("lastName")}
                    placeholder="Last name"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName ? (
                    <FieldError>{errors.lastName.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.email}>
                  <FieldLabel htmlFor="billing-email">
                    Billing email *
                  </FieldLabel>
                  <Input
                    id="billing-email"
                    type="email"
                    {...register("email")}
                    placeholder="Billing email"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email ? (
                    <FieldError>{errors.email.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.phone}>
                  <FieldLabel htmlFor="billing-phone">Phone *</FieldLabel>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id="billing-phone"
                        value={field.value}
                        onChange={(value) => field.onChange(value ?? "")}
                        onBlur={field.onBlur}
                        name={field.name}
                        placeholder="Phone"
                        disabled={isSavingBilling}
                        aria-invalid={!!errors.phone}
                        className="w-full"
                      />
                    )}
                  />
                  {errors.phone ? (
                    <FieldError>{errors.phone.message}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="billing-company">Company</FieldLabel>
                  <Input
                    id="billing-company"
                    {...register("companyName")}
                    placeholder="Company (optional)"
                    disabled={isSavingBilling}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="billing-tax-id">GST/VAT ID</FieldLabel>
                  <Input
                    id="billing-tax-id"
                    {...register("taxId")}
                    placeholder="GST/VAT ID (optional)"
                    disabled={isSavingBilling}
                  />
                </Field>
                <Field data-invalid={!!errors.addressLine1}>
                  <FieldLabel htmlFor="billing-address-line-1">
                    Address line 1 *
                  </FieldLabel>
                  <Input
                    id="billing-address-line-1"
                    {...register("addressLine1")}
                    placeholder="Address line 1"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.addressLine1}
                  />
                  {errors.addressLine1 ? (
                    <FieldError>{errors.addressLine1.message}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="billing-address-line-2">
                    Address line 2
                  </FieldLabel>
                  <Input
                    id="billing-address-line-2"
                    {...register("addressLine2")}
                    placeholder="Address line 2 (optional)"
                    disabled={isSavingBilling}
                  />
                </Field>
                <Field data-invalid={!!errors.city}>
                  <FieldLabel htmlFor="billing-city">City *</FieldLabel>
                  <Input
                    id="billing-city"
                    {...register("city")}
                    placeholder="City"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.city}
                  />
                  {errors.city ? (
                    <FieldError>{errors.city.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.state}>
                  <FieldLabel htmlFor="billing-state">
                    State/Region *
                  </FieldLabel>
                  <Input
                    id="billing-state"
                    {...register("state")}
                    placeholder="State/Region"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.state}
                  />
                  {errors.state ? (
                    <FieldError>{errors.state.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.postalCode}>
                  <FieldLabel htmlFor="billing-postal-code">
                    Postal code *
                  </FieldLabel>
                  <Input
                    id="billing-postal-code"
                    {...register("postalCode")}
                    placeholder="Postal code"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.postalCode}
                  />
                  {errors.postalCode ? (
                    <FieldError>{errors.postalCode.message}</FieldError>
                  ) : null}
                </Field>
                <Field data-invalid={!!errors.country}>
                  <FieldLabel htmlFor="billing-country">Country *</FieldLabel>
                  <Input
                    id="billing-country"
                    {...register("country")}
                    placeholder="Country"
                    disabled={isSavingBilling}
                    aria-invalid={!!errors.country}
                  />
                  {errors.country ? (
                    <FieldError>{errors.country.message}</FieldError>
                  ) : null}
                </Field>
              </FieldGroup>

              {errors.root?.message ? (
                <FieldError className="mt-3">{errors.root.message}</FieldError>
              ) : null}

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => void saveBillingDetails()}
                  disabled={
                    isSavingBilling || order.status !== "pending_payment"
                  }
                >
                  {isSavingBilling && <Spinner data-icon="inline-start" />}
                  Save billing details
                </Button>
              </div>
            </div>

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
                <span className="text-muted-foreground">Duration</span>
                <span>{order.pricing.durationDays} days</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatAmount(order.invoice?.subtotal ?? order.pricing.priceUsdCents)}</span>
              </div>
              <Separator className="my-3" />
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor="coupon-code"
                      className="text-sm text-muted-foreground"
                    >
                      Coupon
                    </label>
                    <Input
                      id="coupon-code"
                      value={couponCode}
                      onChange={(event) =>
                        setCouponCode(event.target.value.toUpperCase())
                      }
                      disabled={isUpdatingCoupon || !!existingPendingTransaction}
                      placeholder="WELCOME10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void updateCoupon(couponCode)}
                    disabled={
                      isUpdatingCoupon ||
                      !!existingPendingTransaction ||
                      couponCode.trim().length === 0
                    }
                  >
                    Apply
                  </Button>
                  {order.invoice?.couponId ? (
                    <Button
                      variant="ghost"
                      onClick={() => void updateCoupon(null)}
                      disabled={isUpdatingCoupon || !!existingPendingTransaction}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {existingPendingTransaction ? (
                  <p className="text-xs text-muted-foreground">
                    Coupon changes are locked after payment starts.
                  </p>
                ) : null}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatAmount(order.invoice?.discount ?? 0)}</span>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-semibold">
                  {formatAmount(
                    order.invoice?.totalAmount ?? order.pricing.priceUsdCents
                  )}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={proceedToPayment}
              disabled={order.status !== "pending_payment" || isSavingBilling}
            >
              {!hasSavedBillingDetails || hasUnsavedBillingChanges
                ? "Save billing & continue to payment"
                : existingPendingTransaction
                  ? "Continue to payment (reuse invoice)"
                  : "Continue to payment"}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </main>
  )
}
