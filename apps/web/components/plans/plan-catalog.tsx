import Link from "next/link"
import type { Route } from "next"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardSquare01Icon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

import { PlanCheckoutButton } from "@/components/home-checkout-actions"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import { getLowestPricingOption, groupPlansBy } from "./plan-utils"

export interface PlanPricingOption {
  id: number
  durationDays: number
  priceUsdCents: number
}

export interface MarketingPlan {
  id: number
  name: string
  cpu: number
  cpuName: string
  cpuThreads: number
  ram: number
  ramType: string
  storage: number
  storageType: string
  bandwidth: string
  os: string
  osVersion: string
  planType: string
  portSpeed: string
  setupFees: number
  planLocation: string
  isFeatured: boolean
  defaultPricingId: number | null
  pricingOptions: PlanPricingOption[]
}

export { getLowestPricingOption, groupPlansBy }

const catalogCardTones = {
  blue: "border-[oklch(0.8_0.08_205)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_205),oklch(0.95_0.04_205))] dark:bg-[linear-gradient(150deg,oklch(0.23_0.055_218),oklch(0.17_0.035_250))]",
  amber:
    "border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_84),oklch(0.96_0.035_78))] dark:bg-[linear-gradient(150deg,oklch(0.23_0.048_72),oklch(0.17_0.035_250))]",
  teal: "border-[oklch(0.82_0.075_166)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_166),oklch(0.95_0.038_166))] dark:bg-[linear-gradient(150deg,oklch(0.21_0.052_166),oklch(0.17_0.035_250))]",
}

const toneKeys = ["blue", "amber", "teal"] as const

export function CategoryCard({
  title,
  count,
  href,
  description,
  tone = "blue",
}: {
  title: string
  count: number
  href: string
  description: string
  tone?: keyof typeof catalogCardTones
}) {
  return (
    <Link
      href={href as Route}
      className={`group relative block overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 ${
        catalogCardTones[tone]
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/70 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/10">
          <HugeiconsIcon icon={ServerStack01Icon} size={20} strokeWidth={2} />
        </span>
        <Badge variant="outline" className="rounded-full">
          {count} plan{count === 1 ? "" : "s"}
        </Badge>
      </div>
      <h2 className="mt-5 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span className="mt-5 inline-flex text-sm font-medium text-[oklch(0.38_0.11_205)] transition-transform group-hover:translate-x-1 dark:text-[oklch(0.8_0.1_205)]">
        View plans
      </span>
    </Link>
  )
}

export function PlanGrid({ plans }: { plans: MarketingPlan[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((plan, index) => {
        const lowestOption = getLowestPricingOption(plan)
        const tone = toneKeys[index % toneKeys.length] ?? "blue"
        return (
          <article
            key={plan.id}
            className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 ${
              catalogCardTones[tone]
            }`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.planType} · {plan.planLocation}
                </p>
              </div>
              {plan.isFeatured ? (
                <Badge variant="secondary" className="rounded-full">
                  Featured
                </Badge>
              ) : null}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border border-white/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/7">
                <p className="text-xs text-muted-foreground">CPU</p>
                <p className="mt-1 font-semibold">{plan.cpu} vCPU</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/7">
                <p className="text-xs text-muted-foreground">RAM</p>
                <p className="mt-1 font-semibold">{plan.ram} GB</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/7">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="mt-1 font-semibold">{plan.storage} GB</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/70 bg-white/45 p-3 text-sm dark:border-white/10 dark:bg-white/7">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">OS</span>
                <span className="font-medium">{plan.osVersion}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">{plan.portSpeed}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{plan.bandwidth}</Badge>
              <Badge variant="outline">{plan.storageType}</Badge>
              <Badge variant="outline">
                {plan.setupFees > 0
                  ? `${formatAmount(plan.setupFees)} setup`
                  : "No setup fee"}
              </Badge>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
              <div>
                <p className="text-xs text-muted-foreground">Starts at</p>
                <p className="text-xl font-semibold">
                  {lowestOption
                    ? formatAmount(lowestOption.priceUsdCents)
                    : "-"}
                </p>
              </div>
              {lowestOption ? (
                <PlanCheckoutButton planPricingId={lowestOption.id} />
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Unavailable
                </Button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function PlansEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[oklch(0.78_0.08_205)]/70 bg-white/70 p-8 text-center shadow-sm dark:border-white/12 dark:bg-white/7">
      <HugeiconsIcon
        icon={DashboardSquare01Icon}
        size={28}
        strokeWidth={2}
        className="mx-auto"
      />
      <h2 className="mt-4 text-lg font-semibold">No active plans found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Active plans will appear here after they are enabled in admin.
      </p>
      <Link href={webPaths.contact}>
        <Button className="mt-5" size="sm" variant="outline">
          Contact support
        </Button>
      </Link>
    </div>
  )
}
