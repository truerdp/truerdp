import Link from "next/link"
import type { Route } from "next"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Switch } from "@workspace/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { Plan } from "@/hooks/use-plans"
import { formatPrice, getDefaultPricingOption } from "@/components/plans-page-parts"

type AdminPlansTableProps = {
  plans: Plan[]
  isTogglingFeatured: (planId: number) => boolean
  isTogglingStatus: (planId: number) => boolean
  onToggleFeatured: (planId: number, isFeatured: boolean) => void
  onActivate: (planId: number) => void
  onDeactivate: (planId: number) => void
}

export function AdminPlansTable({
  plans,
  isTogglingFeatured,
  isTogglingStatus,
  onToggleFeatured,
  onActivate,
  onDeactivate,
}: AdminPlansTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Featured</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Resources</TableHead>
            <TableHead>Pricing Options</TableHead>
            <TableHead className="w-28">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/plans/${plan.id}` as Route}
                    className="text-sm font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none dark:text-emerald-300 dark:hover:text-emerald-200"
                  >
                    {plan.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">ID #{plan.id}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={plan.isActive ? "secondary" : "outline"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    <Switch
                      checked={plan.isFeatured}
                      onCheckedChange={(checked) =>
                        onToggleFeatured(plan.id, checked)
                      }
                      disabled={isTogglingFeatured(plan.id)}
                      aria-label={`Toggle ${plan.name} featured status`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {plan.isFeatured
                      ? "Shown in marketing homepage featured plans"
                      : "Hidden from marketing homepage featured plans"}
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground">
                  <span>{plan.planType}</span>
                  <span>{plan.planLocation}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {plan.cpu} vCPU / {plan.ram} GB RAM / {plan.storage} GB
                </span>
              </TableCell>
              <TableCell>
                <PlanPricingPopover plan={plan} />
              </TableCell>
              <TableCell>
                {plan.isActive ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeactivate(plan.id)}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onActivate(plan.id)}
                    disabled={isTogglingStatus(plan.id)}
                  >
                    Activate
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PlanPricingPopover({ plan }: { plan: Plan }) {
  const defaultPricing = getDefaultPricingOption(
    plan.pricingOptions,
    plan.defaultPricingId
  )

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto justify-start gap-3 px-3 py-2"
          />
        }
      >
        <span className="flex flex-col items-start gap-0.5">
          <span className="text-sm font-medium">
            {defaultPricing
              ? `${formatPrice(defaultPricing.priceUsdCents)} / ${defaultPricing.durationDays}d`
              : "No pricing"}
          </span>
          <span className="text-xs text-muted-foreground">
            {plan.pricingOptions.length} option
            {plan.pricingOptions.length === 1 ? "" : "s"}
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{plan.name} pricing</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-2">
          {plan.pricingOptions.map((pricing) => (
            <div
              key={pricing.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{pricing.durationDays} days</span>
                <span className="text-xs text-muted-foreground">
                  {pricing.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan.defaultPricingId === pricing.id ? (
                  <Badge variant="secondary">Default</Badge>
                ) : null}
                <span className="text-sm font-semibold">
                  {formatPrice(pricing.priceUsdCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
