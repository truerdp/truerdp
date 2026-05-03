import { Badge } from "@workspace/ui/components/badge"
import type { Plan } from "@/hooks/use-plans"

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatUsdFromCents(priceUsdCents: number) {
  return formatUsd(priceUsdCents / 100)
}

type PlanDetailsViewProps = {
  plan: Plan
}

export function PlanDetailsView({ plan }: PlanDetailsViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Plan ID #{plan.id}</p>
          </div>
          <Badge variant={plan.isActive ? "secondary" : "outline"}>
            {plan.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="mb-3 text-sm font-semibold">Resources</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-sm text-muted-foreground">CPU</div>
                <div className="text-2xl font-bold">{plan.cpu}</div>
                <div className="text-xs text-muted-foreground">
                  {plan.cpuName} • {plan.cpuThreads} threads
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-sm text-muted-foreground">RAM</div>
                <div className="text-2xl font-bold">{plan.ram}</div>
                <div className="text-xs text-muted-foreground">
                  GB • {plan.ramType}
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-sm text-muted-foreground">Storage</div>
                <div className="text-2xl font-bold">{plan.storage}</div>
                <div className="text-xs text-muted-foreground">
                  GB • {plan.storageType}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Catalog Metadata</h2>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">Plan Type:</span>{" "}
                {plan.planType}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">Location:</span>{" "}
                {plan.planLocation}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">OS:</span> {plan.os}{" "}
                {plan.osVersion}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">Bandwidth:</span>{" "}
                {plan.bandwidth}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">Port Speed:</span>{" "}
                {plan.portSpeed}
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <span className="text-muted-foreground">Setup Fees:</span>{" "}
                {formatUsd(plan.setupFees)}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold">Pricing Options</h2>
            <div className="space-y-2">
              {plan.pricingOptions.map((pricing) => (
                <div
                  key={pricing.id}
                  className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                >
                  <div>
                    <div className="font-medium">{pricing.durationDays} days</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatUsdFromCents(pricing.priceUsdCents)}
                      </div>
                      <div className="text-xs text-muted-foreground">per duration</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={pricing.isActive ? "secondary" : "outline"}
                        className="w-fit"
                      >
                        {pricing.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {plan.defaultPricingId === pricing.id && (
                        <Badge variant="default" className="w-fit">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
