import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ServerStack01Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/landing/reveal"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { getLowestPricingOption, sectionEyebrowClass } from "./styles"
import type { LocationSectionContent, Plan, PlanPricingOption } from "./types"

interface CatalogInsightsSectionProps {
  plansByLocation: Record<string, Plan[]>
  content: LocationSectionContent
}

export function CatalogInsightsSection({
  plansByLocation,
  content,
}: CatalogInsightsSectionProps) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className={sectionEyebrowClass}>{content.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {content.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {content.description}
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {Object.keys(plansByLocation).length} regions
        </Badge>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Object.entries(plansByLocation).map(
          ([location, groupedPlans], index) => {
            const lowestOption = groupedPlans
              .map((plan) => getLowestPricingOption(plan))
              .filter((option): option is PlanPricingOption => Boolean(option))
              .sort((a, b) => a.priceUsdCents - b.priceUsdCents)[0]

            return (
              <Reveal key={location} delayMs={index * 55}>
                <Link
                  href={webPaths.planCategory(location)}
                  className="group block h-full rounded-2xl border border-[oklch(0.82_0.075_205)]/70 bg-white/75 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-[oklch(0.78_0.08_205)]/60 bg-[oklch(0.96_0.035_205)] text-[oklch(0.34_0.11_212)] dark:border-white/10 dark:bg-white/10 dark:text-white">
                      <HugeiconsIcon
                        icon={ServerStack01Icon}
                        size={18}
                        strokeWidth={2}
                      />
                    </span>
                    <Badge variant="outline" className="rounded-full">
                      {groupedPlans.length}
                    </Badge>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">{location}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {groupedPlans.length} active plan
                    {groupedPlans.length === 1 ? "" : "s"}
                  </p>

                  <div className="mt-4 rounded-xl border border-white/70 bg-white/55 p-3 dark:border-white/10 dark:bg-white/7">
                    <p className="text-xs text-muted-foreground">Starts at</p>
                    <p className="mt-1 text-lg font-semibold">
                      {lowestOption
                        ? formatAmount(lowestOption.priceUsdCents)
                        : "-"}
                    </p>
                  </div>

                  <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                    {groupedPlans.slice(0, 2).map((plan) => (
                      <Badge
                        key={plan.id}
                        variant="outline"
                        className="max-w-full truncate"
                      >
                        {plan.planType}
                      </Badge>
                    ))}
                  </div>

                  <span className="mt-4 inline-flex text-sm font-medium text-[oklch(0.38_0.11_205)] transition-transform group-hover:translate-x-1 dark:text-[oklch(0.8_0.1_205)]">
                    View location
                  </span>
                </Link>
              </Reveal>
            )
          }
        )}
      </div>

      <Reveal className="mt-4">
        <div className="rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(135deg,oklch(0.98_0.02_84),oklch(0.96_0.035_205))] p-4 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,oklch(0.21_0.045_250),oklch(0.18_0.035_230))]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">{content.footerTitle}</p>
              <p className="text-sm text-muted-foreground">
                {content.footerDescription}
              </p>
            </div>
            <Link href={webPaths.plans}>
              <Button size="sm" variant="outline">
                {content.ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
