"use client"

import { useMemo, useState } from "react"
import { usePlans } from "@/hooks/use-plans"
import {
  useTogglePlanFeatured,
  useTogglePlanStatus,
} from "@/hooks/use-manage-plans"
import { Button } from "@workspace/ui/components/button"
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
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PlansEmpty,
  PlansSkeleton,
} from "@/components/plans-page-parts"
import {
  AdminPlansControls,
  AdminPlansHeader,
  type PlanSort,
  type PlanStatusFilter,
} from "@/components/admin-plans/controls"
import { AdminPlansTable } from "@/components/admin-plans/table"

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
      <AdminPlansHeader />
      <AdminPlansControls
        searchValue={searchValue}
        statusFilter={statusFilter}
        sortBy={sortBy}
        onSearchChange={setSearchValue}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSortBy}
      />

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
        <AdminPlansTable
          plans={filteredPlans}
          isTogglingFeatured={(planId) =>
            togglePlanFeatured.isPending &&
            togglePlanFeatured.variables?.planId === planId
          }
          isTogglingStatus={(planId) =>
            togglePlanStatus.isPending &&
            togglePlanStatus.variables?.planId === planId
          }
          onToggleFeatured={(planId, isFeatured) =>
            togglePlanFeatured.mutate({ planId, isFeatured })
          }
          onActivate={(planId) =>
            togglePlanStatus.mutate({
              planId,
              isActive: true,
            })
          }
          onDeactivate={handleDeactivatePlan}
        />
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
