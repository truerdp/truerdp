"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
import { InteractiveHoverButton } from "@workspace/ui/components/interactive-hover-button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"

import { useProfile } from "@/hooks/use-profile"
import { webPaths } from "@/lib/paths"

interface CreateOrderResponse {
  orderId: number
}

function useCheckoutStarter() {
  const router = useRouter()
  const { data: profile, isLoading: isProfileLoading } = useProfile()

  const startCheckout = useCallback(
    async (planPricingId: number) => {
      if (!profile) {
        if (isProfileLoading) {
          toast.message("Checking your session")
          return
        }

        const redirectPath = `${webPaths.home}?planPricingId=${planPricingId}`
        router.push(
          `${webPaths.login}?redirect=${encodeURIComponent(redirectPath)}`
        )
        return
      }

      try {
        const order = await clientApi<CreateOrderResponse>("/orders", {
          method: "POST",
          body: {
            planPricingId,
          },
        })

        router.push(webPaths.checkoutReviewOrder(order.orderId))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create order"
        toast.error(message)
      }
    },
    [isProfileLoading, profile, router]
  )

  return { isProfileLoading, startCheckout }
}

export function PlanCheckoutButton({
  planPricingId,
  children = "Select",
  className,
  variant = "default",
}: {
  planPricingId: number
  children?: React.ReactNode
  className?: string
  variant?: "default" | "shimmer" | "interactive"
}) {
  const { startCheckout } = useCheckoutStarter()

  if (variant === "shimmer") {
    return (
      <ShimmerButton
        type="button"
        className={cn("h-9 gap-1.5 px-4 py-0 text-sm font-medium", className)}
        background="linear-gradient(135deg, oklch(0.52 0.16 248), oklch(0.54 0.14 190))"
        onClick={() => void startCheckout(planPricingId)}
      >
        <HugeiconsIcon
          icon={CreditCardIcon}
          size={16}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {children}
      </ShimmerButton>
    )
  }

  if (variant === "interactive") {
    return (
      <InteractiveHoverButton
        type="button"
        className={cn("h-8 px-4 text-sm", className)}
        onClick={() => void startCheckout(planPricingId)}
      >
        {children}
      </InteractiveHoverButton>
    )
  }

  return (
    <Button
      size="sm"
      className={className}
      onClick={() => void startCheckout(planPricingId)}
    >
      <HugeiconsIcon
        icon={CreditCardIcon}
        size={16}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {children}
    </Button>
  )
}

export function HomeAutoCheckout() {
  const searchParams = useSearchParams()
  const { isProfileLoading, startCheckout } = useCheckoutStarter()
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
    void startCheckout(pendingPlanPricingId)
  }, [isProfileLoading, pendingPlanPricingId, startCheckout])

  return null
}
