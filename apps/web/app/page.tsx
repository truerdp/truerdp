"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, ServerStack01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { usePlans } from "@/hooks/use-plans"
import { getAuthToken } from "@/lib/auth"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"

function PlanCardSkeleton() {
  return (
    <div className="rounded-xl border p-5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-6 h-20 w-full" />
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const { data, isLoading, error } = usePlans()

  const plans = data ?? []

  const planCountLabel = useMemo(() => {
    if (isLoading) return "Loading plans"
    if (plans.length === 0) return "No active plans"
    return `${plans.length} active plan${plans.length > 1 ? "s" : ""}`
  }, [isLoading, plans.length])

  const plansByType = useMemo(() => {
    return plans.reduce<Record<string, typeof plans>>((acc, plan) => {
      const key = plan.planType
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(plan)
      return acc
    }, {})
  }, [plans])

  const plansByLocation = useMemo(() => {
    return plans.reduce<Record<string, typeof plans>>((acc, plan) => {
      const key = plan.planLocation
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(plan)
      return acc
    }, {})
  }, [plans])

  function startCheckout(planPricingId: number) {
    const checkoutPath = `${webPaths.checkout}?planPricingId=${planPricingId}`

    if (!getAuthToken()) {
      router.push(
        `${webPaths.login}?redirect=${encodeURIComponent(checkoutPath)}`
      )
      return
    }

    router.push(checkoutPath)
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <section className="rounded-2xl border bg-gradient-to-b from-muted/50 to-background p-8">
        <Badge variant="secondary" className="mb-3">
          <HugeiconsIcon icon={ServerStack01Icon} size={14} strokeWidth={2} />
          Instant setup workflow
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Choose a TrueRDP plan and start your order in minutes
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          Select duration, pick a payment method, and generate a transaction.
          Provisioning is then handled by admin confirmation in the current
          flow.
        </p>
        <div className="mt-4 text-sm text-muted-foreground">
          {planCountLabel}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <PlanCardSkeleton key={index} />
          ))}

        {!isLoading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && plans.length === 0 && (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No active plans are available right now.
          </div>
        )}

        {plans.map((plan) => (
          <article key={plan.id} className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold">{plan.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {plan.cpu} vCPU • {plan.ram} GB RAM • {plan.storage} GB Storage
            </p>

            <div className="mt-5 space-y-2">
              {plan.pricingOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {option.durationDays} days
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(option.price)} total
                    </p>
                  </div>
                  <Button size="sm" onClick={() => startCheckout(option.id)}>
                    <HugeiconsIcon
                      icon={CreditCardIcon}
                      size={16}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {!isLoading && !error && plans.length > 0 ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-muted/20 p-5">
            <h2 className="text-lg font-semibold">Plans by Type</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(plansByType).map(([planType, groupedPlans]) => (
                <div key={planType} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {planType}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {groupedPlans.map((plan) => (
                      <Badge key={plan.id} variant="outline">
                        {plan.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-5">
            <h2 className="text-lg font-semibold">Plans by Location</h2>
            <div className="mt-4 space-y-4">
              {Object.entries(plansByLocation).map(
                ([planLocation, groupedPlans]) => (
                  <div key={planLocation} className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      {planLocation}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupedPlans.map((plan) => (
                        <Badge key={plan.id} variant="outline">
                          {plan.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
