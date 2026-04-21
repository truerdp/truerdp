"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { clientApi } from "@workspace/api"
import { Button } from "@workspace/ui/components/button"
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
}: {
  planPricingId: number
}) {
  const { startCheckout } = useCheckoutStarter()

  return (
    <Button size="sm" onClick={() => void startCheckout(planPricingId)}>
      <HugeiconsIcon
        icon={CreditCardIcon}
        size={16}
        strokeWidth={2}
        data-icon="inline-start"
      />
      Select
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
