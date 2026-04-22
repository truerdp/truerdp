import type { Metadata } from "next"

import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, ServerStack01Icon } from "@hugeicons/core-free-icons"
import { serverApi } from "@workspace/api"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"

import {
  HomeAutoCheckout,
  PlanCheckoutButton,
} from "@/components/home-checkout-actions"
import { formatAmount } from "@/lib/format"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "TrueRDP Plans",
  description:
    "Browse TrueRDP hosting plans, compare pricing, and start checkout instantly.",
}

interface PlanPricingOption {
  id: number
  durationDays: number
  priceUsdCents: number
}

interface Plan {
  id: number
  name: string
  cpu: number
  ram: number
  storage: number
  planType: string
  planLocation: string
  pricingOptions: PlanPricingOption[]
}

async function getPlans() {
  try {
    const plans = await serverApi<Plan[]>("/plans", {
      cache: "no-store",
    })

    return { plans, error: null }
  } catch (error) {
    return {
      plans: [] as Plan[],
      error: error instanceof Error ? error.message : "Unable to load plans",
    }
  }
}

export default async function Page() {
  const { plans, error } = await getPlans()

  const planCountLabel =
    plans.length === 0
      ? "No active plans"
      : `${plans.length} active plan${plans.length > 1 ? "s" : ""}`

  const plansByType = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    const key = plan.planType

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(plan)
    return acc
  }, {})

  const plansByLocation = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    const key = plan.planLocation

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(plan)
    return acc
  }, {})

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <HomeAutoCheckout />

      <section className="rounded-2xl border bg-linear-to-b from-muted/50 to-background p-8">
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

      {error ? (
        <Alert variant="destructive" className="mt-8">
          <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
          <AlertTitle>Unable to load plans</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.length === 0 && !error ? (
          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            No active plans are available right now.
          </div>
        ) : null}

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
                      {formatAmount(option.priceUsdCents)} total
                    </p>
                  </div>
                  <PlanCheckoutButton planPricingId={option.id} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {!error && plans.length > 0 ? (
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
