import type { Metadata } from "next"
import Link from "next/link"
import { Plus_Jakarta_Sans } from "next/font/google"
import { serverApi } from "@workspace/api"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import {
  CategoryCard,
  getLowestPricingOption,
  groupPlansBy,
  type MarketingPlan,
  PlansEmptyState,
} from "@/components/plans/plan-catalog"
import { webPaths } from "@/lib/paths"
import { formatAmount } from "@/lib/format"
import { Button } from "@workspace/ui/components/button"
const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Plans | TrueRDP",
  description:
    "Browse TrueRDP plans by location or type, then choose the right RDP configuration for checkout.",
}
async function getPlans() {
  try {
    const plans = await serverApi<MarketingPlan[]>("/plans", {
      cache: "no-store",
    })

    return { plans, error: null }
  } catch (error) {
    return {
      plans: [] as MarketingPlan[],
      error: error instanceof Error ? error.message : "Unable to load plans",
    }
  }
}
export default async function PlansPage() {
  const { plans, error } = await getPlans()
  const plansByType = groupPlansBy(plans, (plan) => plan.planType)
  const plansByLocation = groupPlansBy(plans, (plan) => plan.planLocation)
  const lowestOption = plans
    .map((plan) => getLowestPricingOption(plan))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .sort((a, b) => a.priceUsdCents - b.priceUsdCents)[0]

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_48%,oklch(0.985_0.018_166)_100%)] pb-14 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 bg-[linear-gradient(115deg,oklch(0.95_0.05_78/0.56)_0%,transparent_34%),linear-gradient(245deg,oklch(0.82_0.075_205/0.42)_0%,transparent_44%)]" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge
            variant="secondary"
            className="rounded-full border border-[oklch(0.78_0.08_205)] bg-[oklch(0.97_0.035_205)] px-4 py-1.5 text-[oklch(0.31_0.09_212)] dark:border-white/10 dark:bg-white/8 dark:text-white/80"
          >
            Plan catalog
          </Badge>
          <h1
            className={`${displayFont.className} mt-5 max-w-3xl text-4xl leading-[1.04] tracking-tight text-[oklch(0.2_0.045_265)] md:text-5xl dark:text-white`}
          >
            Find the RDP configuration that matches your workload
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[oklch(0.35_0.04_250)] md:text-lg dark:text-white/76">
            Compare dedicated and residential lanes, deployment regions, entry
            prices, and plan capacity before moving into checkout.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#by-type">
              <Button size="sm">Browse by type</Button>
            </Link>
            <Link href="#by-location">
              <Button size="sm" variant="outline">
                Browse by location
              </Button>
            </Link>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-6 text-white shadow-2xl shadow-[oklch(0.45_0.1_220)]/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <p className="text-sm text-white/58">Catalog snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Active plans</p>
              <p className="mt-1 text-2xl font-semibold">{plans.length}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Locations</p>
              <p className="mt-1 text-2xl font-semibold">
                {Object.keys(plansByLocation).length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Plan types</p>
              <p className="mt-1 text-2xl font-semibold">
                {Object.keys(plansByType).length}
              </p>
            </div>
            <div className="rounded-2xl border border-[oklch(0.7_0.12_166)]/35 bg-[oklch(0.3_0.08_170)]/35 p-4">
              <p className="text-xs text-white/55">Starts at</p>
              <p className="mt-1 text-2xl font-semibold">
                {lowestOption ? formatAmount(lowestOption.priceUsdCents) : "-"}
              </p>
            </div>
          </div>
        </aside>
      </section>

      {error ? (
        <section className="mx-auto mt-8 w-full max-w-6xl px-6">
          <Alert variant="destructive">
            <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={2} />
            <AlertTitle>Unable to load plans</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </section>
      ) : null}

      {plans.length === 0 ? (
        <section className="mx-auto mt-10 w-full max-w-6xl px-6">
          <PlansEmptyState />
        </section>
      ) : (
        <>
          <section id="by-type" className="mx-auto mt-14 w-full max-w-6xl px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
                  Workload lanes
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  By type
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the infrastructure lane before comparing plans.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Object.entries(plansByType).map(
                ([planType, groupedPlans], index) => (
                  <CategoryCard
                    key={planType}
                    title={planType}
                    count={groupedPlans.length}
                    href={webPaths.planCategory(planType)}
                    description={`Compare ${planType.toLowerCase()} plans across available locations and durations.`}
                    tone={index % 2 === 0 ? "blue" : "amber"}
                  />
                )
              )}
            </div>
          </section>

          <section
            id="by-location"
            className="mx-auto mt-14 w-full max-w-6xl px-6"
          >
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
                Deployment regions
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                By location
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with geography when latency and jurisdiction matter most.
              </p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(plansByLocation).map(
                ([location, groupedPlans], index) => (
                  <CategoryCard
                    key={location}
                    title={location}
                    count={groupedPlans.length}
                    href={webPaths.planCategory(location)}
                    description={`See active TrueRDP plans currently available in ${location}.`}
                    tone={
                      index % 3 === 0
                        ? "teal"
                        : index % 3 === 1
                          ? "blue"
                          : "amber"
                    }
                  />
                )
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
