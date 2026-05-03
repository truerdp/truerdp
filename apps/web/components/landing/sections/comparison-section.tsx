import { Reveal } from "@/components/landing/reveal"
import { PlanCheckoutButton } from "@/components/home-checkout-actions"
import { formatAmount } from "@/lib/format"
import { Badge } from "@workspace/ui/components/badge"
import { getLowestPricingOption, sectionEyebrowClass } from "./styles"
import type { Plan } from "./types"

interface ComparisonSectionProps {
  plans: Plan[]
  title: string
  description: string
}

export function ComparisonSection({
  plans,
  title,
  description,
}: ComparisonSectionProps) {
  return (
    <section id="compare" className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[oklch(0.22_0.045_250)]">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className={sectionEyebrowClass}>Decision table</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <Badge variant="outline" className="w-fit rounded-full">
              {plans.length} active plans
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 md:hidden">
            {plans.map((plan) => (
              <article
                key={`compare-mobile-${plan.id}`}
                className="rounded-2xl border border-border/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/7"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.planType} · {plan.planLocation}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {plan.pricingOptions.length > 0
                      ? formatAmount(
                          getLowestPricingOption(plan)?.priceUsdCents || 0
                        )
                      : "N/A"}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <MiniSpec label="CPU" value={`${plan.cpu}`} />
                  <MiniSpec label="RAM" value={`${plan.ram} GB`} />
                  <MiniSpec label="SSD" value={`${plan.storage} GB`} />
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {plan.pricingOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/70 px-3 py-2 shadow-xs dark:border-white/10 dark:bg-white/7"
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
            ))}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-175 text-left text-sm">
              <thead>
                <tr className="border-b text-[oklch(0.45_0.06_250)] dark:text-white/60">
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">CPU</th>
                  <th className="py-2 pr-3 font-medium">RAM</th>
                  <th className="py-2 pr-3 font-medium">Storage</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={`compare-${plan.id}`}
                    className="border-b transition-colors last:border-b-0 hover:bg-[oklch(0.97_0.03_88)]/70 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pr-3 font-medium">{plan.name}</td>
                    <td className="py-2 pr-3">{plan.cpu} vCPU</td>
                    <td className="py-2 pr-3">{plan.ram} GB</td>
                    <td className="py-2 pr-3">{plan.storage} GB</td>
                    <td className="py-2 pr-3">{plan.planType}</td>
                    <td className="py-2 pr-3">{plan.planLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

function MiniSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/7">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}
