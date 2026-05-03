import { PlanCheckoutButton } from "@/components/home-checkout-actions"
import { Reveal } from "@/components/landing/reveal"
import { formatAmount } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import {
  getLowestPricingOption,
  planCardStyles,
  sectionEyebrowClass,
} from "./styles"
import type { Plan } from "./types"

interface FeaturedPlansSectionProps {
  displayClassName: string
  plans: Plan[]
  title: string
  description: string
}

export function FeaturedPlansSection({
  displayClassName,
  plans,
  title,
  description,
}: FeaturedPlansSectionProps) {
  return (
    <section
      id="plans"
      className="mx-auto mt-16 w-full max-w-6xl scroll-mt-20 px-6"
    >
      <Reveal className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={sectionEyebrowClass}>Featured inventory</p>
          <h2
            className={`${displayClassName} text-2xl tracking-tight md:text-3xl`}
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          Admin featured
        </Badge>
      </Reveal>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <Reveal key={plan.id} delayMs={index * 70}>
            <article
              className={`group relative h-full overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                planCardStyles[index % planCardStyles.length] ?? ""
              } dark:border-white/10`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.planType} · {plan.planLocation}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {getLowestPricingOption(plan)
                    ? formatAmount(
                        getLowestPricingOption(plan)?.priceUsdCents || 0
                      )
                    : "N/A"}
                </Badge>
              </div>

              <p className="mt-4 text-sm text-foreground/85">
                {plan.cpu} vCPU · {plan.ram} GB RAM · {plan.storage} GB SSD
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <SpecCard label="CPU" value={`${plan.cpu}`} />
                <SpecCard label="RAM" value={`${plan.ram} GB`} />
                <SpecCard label="SSD" value={`${plan.storage} GB`} />
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {plan.pricingOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 shadow-xs dark:border-white/10 dark:bg-white/7"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">
                        {option.durationDays} days
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatAmount(option.priceUsdCents)}
                      </p>
                    </div>
                    <PlanCheckoutButton planPricingId={option.id} />
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/7">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
