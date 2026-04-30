import type { Metadata } from "next"
import Link from "next/link"
import { Plus_Jakarta_Sans } from "next/font/google"

import { serverApi } from "@workspace/api"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon, ArrowLeftIcon } from "@hugeicons/core-free-icons"

import {
  type MarketingPlan,
  getLowestPricingOption,
  PlanGrid,
  PlansEmptyState,
} from "@/components/plans/plan-catalog"
import { webPaths } from "@/lib/paths"
import { formatAmount } from "@/lib/format"

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
})

export const dynamic = "force-dynamic"

interface PlansCategoryPageProps {
  params: Promise<{
    category: string
  }>
}

function toCategorySlug(value: string) {
  return value.trim().toLowerCase().replaceAll(" ", "-")
}

function formatCategoryValue(value: string) {
  return decodeURIComponent(value).replaceAll("-", " ")
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

function resolveCategory(plans: MarketingPlan[], rawCategory: string) {
  const categorySlug = toCategorySlug(formatCategoryValue(rawCategory))
  const matchingTypes = plans.filter(
    (plan) => toCategorySlug(plan.planType) === categorySlug
  )

  if (matchingTypes.length > 0) {
    return {
      label: matchingTypes[0]?.planType ?? formatCategoryValue(rawCategory),
      eyebrow: "Plans by type",
      plans: matchingTypes,
    }
  }

  const matchingLocations = plans.filter(
    (plan) => toCategorySlug(plan.planLocation) === categorySlug
  )

  if (matchingLocations.length > 0) {
    return {
      label:
        matchingLocations[0]?.planLocation ?? formatCategoryValue(rawCategory),
      eyebrow: "Plans by location",
      plans: matchingLocations,
    }
  }

  return {
    label: formatCategoryValue(rawCategory),
    eyebrow: "Plans",
    plans: [] as MarketingPlan[],
  }
}

export async function generateMetadata({
  params,
}: PlansCategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const label = formatCategoryValue(category)

  return {
    title: `${label} Plans | TrueRDP`,
    description: `Browse active TrueRDP plans for ${label}.`,
  }
}

export default async function PlansCategoryPage({
  params,
}: PlansCategoryPageProps) {
  const { category } = await params
  const { plans, error } = await getPlans()
  const resolvedCategory = resolveCategory(plans, category)
  const lowestOption = resolvedCategory.plans
    .map((plan) => getLowestPricingOption(plan))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .sort((a, b) => a.priceUsdCents - b.priceUsdCents)[0]
  const locations = new Set(
    resolvedCategory.plans.map((plan) => plan.planLocation)
  ).size
  const planTypes = new Set(resolvedCategory.plans.map((plan) => plan.planType))
    .size

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_48%,oklch(0.985_0.018_166)_100%)] pb-14 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 bg-[linear-gradient(115deg,oklch(0.95_0.05_78/0.52)_0%,transparent_34%),linear-gradient(245deg,oklch(0.82_0.075_205/0.42)_0%,transparent_44%)]" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-10 md:pt-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Link href={webPaths.plans}>
            <Button size="sm" variant="outline">
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                size={16}
                strokeWidth={2}
                className="mr-1"
              />
              Back to categories
            </Button>
          </Link>

          <h1
            className={`${displayFont.className} mt-5 max-w-3xl text-4xl leading-[1.04] tracking-tight text-[oklch(0.2_0.045_265)] md:text-5xl dark:text-white`}
          >
            {resolvedCategory.label} plans
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[oklch(0.35_0.04_250)] md:text-lg dark:text-white/76">
            Compare active resources, included metadata, and entry pricing
            before checkout.
          </p>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-6 text-white shadow-2xl shadow-[oklch(0.45_0.1_220)]/20">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <p className="text-sm text-white/58">Category snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Matching plans</p>
              <p className="mt-1 text-2xl font-semibold">
                {resolvedCategory.plans.length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Locations</p>
              <p className="mt-1 text-2xl font-semibold">{locations}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs text-white/50">Plan types</p>
              <p className="mt-1 text-2xl font-semibold">{planTypes}</p>
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

      <section className="mx-auto mt-10 w-full max-w-6xl px-6">
        {resolvedCategory.plans.length > 0 ? (
          <PlanGrid plans={resolvedCategory.plans} />
        ) : (
          <PlansEmptyState />
        )}
      </section>
    </main>
  )
}
