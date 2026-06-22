"use client"

import { Suspense, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  Delete02Icon,
  Invoice03Icon,
  MinusSignIcon,
  PlusSignIcon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

import { useCart, type CartItem } from "@/components/cart/cart-provider"
import { useProfile } from "@/hooks/use-profile"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

export default function CartPage() {
  return (
    <Suspense fallback={<CartPageFallback />}>
      <CartPageContent />
    </Suspense>
  )
}

function CartPageContent() {
  const cart = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileQuery = useProfile()
  const addAttemptRef = useRef<number | null>(null)
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)

  useEffect(() => {
    if (profileQuery.isLoading || isAuthenticated) {
      return
    }

    router.push(
      `${webPaths.login}?redirect=${encodeURIComponent(webPaths.cart)}`
    )
  }, [isAuthenticated, profileQuery.isLoading, router])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const rawPlanPricingId = searchParams.get("addPlanPricingId")
    const planPricingId = rawPlanPricingId ? Number(rawPlanPricingId) : null

    if (
      !Number.isInteger(planPricingId) ||
      !planPricingId ||
      addAttemptRef.current === planPricingId
    ) {
      return
    }

    addAttemptRef.current = planPricingId
    void cart
      .addItem({ planPricingId })
      .then(() => {
        toast.success("Plan added to cart")
        router.replace(webPaths.cart)
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Unable to add item to cart"
        toast.error(message)
      })
  }, [cart, isAuthenticated, router, searchParams])

  async function checkoutCart() {
    try {
      const order = await cart.checkoutCart()
      router.push(webPaths.checkoutReviewOrder(order.orderId))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to checkout cart"
      toast.error(message)
    }
  }

  return (
    <main className="min-h-[70svh] bg-[linear-gradient(180deg,oklch(0.985_0.022_205),oklch(0.975_0.02_84))] py-10 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252),oklch(0.14_0.032_240))]">
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="rounded-full">
              Shopping cart
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Review your services
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your cart is saved to your account, so you can continue checkout
              from any device after signing in.
            </p>
          </div>
          <Link href={webPaths.plans}>
            <Button variant="outline">Browse all plans</Button>
          </Link>
        </div>

        {cart.isLoading || profileQuery.isLoading ? (
          <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
            <Spinner className="mx-auto" />
            <p className="mt-3 text-sm text-muted-foreground">
              Loading your cart...
            </p>
          </div>
        ) : cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {cart.items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>

            <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />
                <h2 className="text-lg font-semibold">Order summary</h2>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <SummaryRow label="Items" value={String(cart.itemCount)} />
                <SummaryRow
                  label="Subtotal"
                  value={formatAmount(cart.subtotalUsdCents)}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  A single order and invoice will be created for the complete
                  cart. Payment confirmation provisions each purchased service.
                </p>
              </div>
              <Button
                className="mt-5 w-full"
                disabled={cart.isMutating || cart.items.length === 0}
                onClick={() => void checkoutCart()}
              >
                {cart.isMutating ? <Spinner data-icon="inline-start" /> : null}
                <HugeiconsIcon
                  icon={CreditCardIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Checkout cart
              </Button>
              <Button
                variant="ghost"
                className="mt-2 w-full"
                disabled={cart.isMutating}
                onClick={() => void cart.clearCart()}
              >
                Clear cart
              </Button>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function CartPageFallback() {
  return (
    <main className="min-h-[70svh] bg-[linear-gradient(180deg,oklch(0.985_0.022_205),oklch(0.975_0.02_84))] py-10 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252),oklch(0.14_0.032_240))]">
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
          <Spinner className="mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            Loading your cart...
          </p>
        </div>
      </section>
    </main>
  )
}

function EmptyCart() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed bg-card p-10 text-center shadow-sm">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl border bg-muted/40">
        <HugeiconsIcon icon={ServerStack01Icon} strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-lg font-semibold">Your cart is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Add one or more RDP plans, then return here to create a single invoice.
      </p>
      <Link href={webPaths.plans}>
        <Button className="mt-5">Browse plans</Button>
      </Link>
    </div>
  )
}

function CartLineItem({ item }: { item: CartItem }) {
  const cart = useCart()

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{item.planName}</h2>
            <Badge variant="outline">{item.durationDays} days</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.planType} - {item.planLocation}
          </p>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-2 text-xs">
            <MiniSpec label="CPU" value={`${item.cpu} vCPU`} />
            <MiniSpec label="RAM" value={`${item.ram} GB`} />
            <MiniSpec label="SSD" value={`${item.storage} GB`} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          <div className="text-left md:text-right">
            <p className="text-base font-semibold">
              {formatAmount(item.lineTotalUsdCents)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatAmount(item.priceUsdCents)} each
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              disabled={cart.isMutating}
              aria-label={`Decrease ${item.planName} quantity`}
              onClick={() =>
                item.quantity > 1
                  ? void cart.setItemQuantity(item.id, item.quantity - 1)
                  : void cart.removeItem(item.id)
              }
            >
              <HugeiconsIcon icon={MinusSignIcon} size={14} strokeWidth={2} />
            </Button>
            <span className="inline-flex h-8 min-w-9 items-center justify-center rounded-md border bg-background px-2 text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-8"
              disabled={cart.isMutating}
              aria-label={`Increase ${item.planName} quantity`}
              onClick={() =>
                void cart.setItemQuantity(item.id, item.quantity + 1)
              }
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={cart.isMutating}
              aria-label={`Remove ${item.planName}`}
              onClick={() => void cart.removeItem(item.id)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

function MiniSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-2 py-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
