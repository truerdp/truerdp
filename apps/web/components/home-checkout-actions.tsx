"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { InteractiveHoverButton } from "@workspace/ui/components/interactive-hover-button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"

import { useCart, type CartItemInput } from "@/components/cart/cart-provider"
import { useProfile } from "@/hooks/use-profile"
import { webPaths } from "@/lib/paths"

function useCartStarter() {
  const router = useRouter()
  const cart = useCart()
  const { data: profile, isLoading: isProfileLoading } = useProfile()

  const addToCart = useCallback(
    async (planPricingId: number, item?: CartItemInput) => {
      if (!profile) {
        if (isProfileLoading) {
          toast.message("Checking your session")
          return false
        }

        const redirectPath = `${webPaths.cart}?addPlanPricingId=${planPricingId}`
        router.push(
          `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
        )
        return false
      }

      try {
        await cart.addItem(item ?? { planPricingId })
        toast.success(`${item?.planName ?? "Plan"} added to cart`)
        router.push(webPaths.cart)
        return true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to add item to cart"
        toast.error(message)
        return false
      }
    },
    [cart, isProfileLoading, profile, router]
  )

  return { addToCart, isProfileLoading }
}

export function PlanCheckoutButton({
  planPricingId,
  children = "Select",
  className,
  variant = "default",
  cartItem,
}: {
  planPricingId: number
  children?: React.ReactNode
  className?: string
  variant?: "default" | "shimmer" | "interactive"
  cartItem?: CartItemInput
}) {
  const cart = useCart()
  const router = useRouter()
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const { addToCart } = useCartStarter()
  const buttonChildren = cartItem ? (children ?? "Add") : children

  async function onSelectPlan() {
    if (!cartItem) {
      void addToCart(planPricingId)
      return
    }

    if (!profile) {
      if (isProfileLoading) {
        toast.message("Checking your session")
        return
      }

      const redirectPath = `${webPaths.cart}?addPlanPricingId=${planPricingId}`
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
      )
      return
    }

    try {
      await cart.addItem(cartItem)
      toast.success(`${cartItem.planName ?? "Plan"} added to cart`)
      router.push(webPaths.cart)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to add item to cart"
      toast.error(message)
    }
  }

  if (variant === "shimmer") {
    return (
      <ShimmerButton
        type="button"
        className={cn("h-9 gap-1.5 px-4 py-0 text-sm font-medium", className)}
        background="linear-gradient(135deg, oklch(0.52 0.16 248), oklch(0.54 0.14 190))"
        onClick={() => void onSelectPlan()}
      >
        <HugeiconsIcon
          icon={CreditCardIcon}
          size={16}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {buttonChildren}
      </ShimmerButton>
    )
  }

  if (variant === "interactive") {
    return (
      <InteractiveHoverButton
        type="button"
        className={cn("h-8 px-4 text-sm", className)}
        onClick={() => void onSelectPlan()}
      >
        {buttonChildren}
      </InteractiveHoverButton>
    )
  }

  return (
    <Button size="sm" className={className} onClick={() => void onSelectPlan()}>
      <HugeiconsIcon
        icon={CreditCardIcon}
        size={16}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {buttonChildren}
    </Button>
  )
}

export function HomeAutoCheckout() {
  const searchParams = useSearchParams()
  const { addToCart, isProfileLoading } = useCartStarter()
  const autoCheckoutAttemptRef = useRef<number | null>(null)

  const pendingPlanPricingId = useMemo(() => {
    const rawValue = searchParams.get("planPricingId")

    if (!rawValue) {
      return null
    }

    const parsed = Number(rawValue)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }, [searchParams])

  useEffect(() => {
    if (pendingPlanPricingId == null || isProfileLoading) {
      return
    }

    if (autoCheckoutAttemptRef.current === pendingPlanPricingId) {
      return
    }

    autoCheckoutAttemptRef.current = pendingPlanPricingId
    void addToCart(pendingPlanPricingId)
  }, [addToCart, isProfileLoading, pendingPlanPricingId])

  return null
}
