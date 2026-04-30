"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { usePlans } from "@/hooks/use-plans"
import {
  useTogglePlanFeatured,
  useTogglePlanStatus,
} from "@/hooks/use-manage-plans"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import {
  Alert02Icon,
  Add01Icon,
  Package02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type PlanStatusFilter = "all" | "active" | "inactive"
type PlanSort = "name" | "cpu" | "price"

function formatPrice(priceUsdCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(priceUsdCents / 100)
}

function getDefaultPricingOption(
  pricingOptions: Array<{
    id: number
    durationDays: number
    priceUsdCents: number
    isActive: boolean
  }>,
  defaultPricingId: number | null
) {
  return (
    pricingOptions.find((option) => option.id === defaultPricingId) ??
    pricingOptions.find((option) => option.isActive) ??
    pricingOptions[0] ??
    null
  )
}

function PlansSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Plan</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Resources</TableHead>
          <TableHead>Pricing Options</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-36" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-44" />
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-24" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PlansEmpty() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No plans found</EmptyTitle>
        <EmptyDescription>
          Create plans and pricing options to start offering subscriptions.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default function AdminPlansPage() {
  const { data, isLoading, isError, error } = usePlans()
  const togglePlanStatus = useTogglePlanStatus()
  const togglePlanFeatured = useTogglePlanFeatured()

  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<PlanStatusFilter>("all")
  const [sortBy, setSortBy] = useState<PlanSort>("name")
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedDeactivatePlanId, setSelectedDeactivatePlanId] = useState<
    number | null
  >(null)

  const plans = data ?? []

  const filteredPlans = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    const matches = plans.filter((plan) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        plan.name.toLowerCase().includes(normalizedQuery) ||
        String(plan.id).includes(normalizedQuery)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.isActive) ||
        (statusFilter === "inactive" && !plan.isActive)

      return matchesSearch && matchesStatus
    })

    return matches.sort((a, b) => {
      if (sortBy === "cpu") {
        return b.cpu - a.cpu
      }

      if (sortBy === "price") {
        const aDefault =
          a.pricingOptions.find((option) => option.id === a.defaultPricingId) ??
          a.pricingOptions[0]
        const bDefault =
          b.pricingOptions.find((option) => option.id === b.defaultPricingId) ??
          b.pricingOptions[0]

        return (aDefault?.priceUsdCents ?? 0) - (bDefault?.priceUsdCents ?? 0)
      }

      return a.name.localeCompare(b.name)
    })
  }, [plans, searchValue, sortBy, statusFilter])

  const handleDeactivatePlan = (planId: number) => {
    setSelectedDeactivatePlanId(planId)
    setDeactivateDialogOpen(true)
  }

  const confirmDeactivatePlan = async () => {
    if (!selectedDeactivatePlanId) {
      return
    }

    try {
      await togglePlanStatus.mutateAsync({
        planId: selectedDeactivatePlanId,
        isActive: false,
      })
      setDeactivateDialogOpen(false)
      setSelectedDeactivatePlanId(null)
    } catch {
      // Mutation hook handles errors.
    }
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            Create, update, and manage plan availability with pricing durations.
          </p>
        </div>
        <Link href="/plans/create">
          <Button>
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Create Plan
          </Button>
        </Link>
      </div>

      <div className="my-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:max-w-xs">
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by plan name or ID"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ToggleGroup
            value={[statusFilter]}
            onValueChange={(value) => {
              const next = value[0]
              if (next === "all" || next === "active" || next === "inactive") {
                setStatusFilter(next)
              }
            }}
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="active">Active</ToggleGroupItem>
            <ToggleGroupItem value="inactive">Inactive</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                if (value === "name" || value === "cpu" || value === "price") {
                  setSortBy(value)
                }
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cpu">CPU</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border">
          <PlansSkeleton />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-destructive">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
          <span>{error.message || "Failed to load plans."}</span>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-lg border">
          <PlansEmpty />
        </div>
      ) : (
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
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/plans/${plan.id}` as Route}
                        className="text-sm font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none dark:text-emerald-300 dark:hover:text-emerald-200"
                      >
                        {plan.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        ID #{plan.id}
                      </span>
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
                            togglePlanFeatured.mutate({
                              planId: plan.id,
                              isFeatured: checked,
                            })
                          }
                          disabled={
                            togglePlanFeatured.isPending &&
                            togglePlanFeatured.variables?.planId === plan.id
                          }
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
                    {(() => {
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
                                    <span className="text-sm font-medium">
                                      {pricing.durationDays} days
                                    </span>
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
                    })()}
                  </TableCell>
                  <TableCell>
                    {plan.isActive ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeactivatePlan(plan.id)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          togglePlanStatus.mutate({
                            planId: plan.id,
                            isActive: true,
                          })
                        }
                        disabled={
                          togglePlanStatus.isPending &&
                          togglePlanStatus.variables?.planId === plan.id
                        }
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
      )}

      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the plan from public checkout and marketing catalog
              views. Existing orders and instances keep their plan snapshots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={togglePlanStatus.isPending}
              onClick={() => setSelectedDeactivatePlanId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={togglePlanStatus.isPending}
              onClick={confirmDeactivatePlan}
            >
              {togglePlanStatus.isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
