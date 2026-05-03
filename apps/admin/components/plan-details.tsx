"use client"

import { useState } from "react"
import Link from "next/link"
import type { Route } from "next"
import { ArrowLeft, PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { usePlans, type Plan } from "@/hooks/use-plans"
import { useTogglePlanStatus, useUpdatePlan } from "@/hooks/use-manage-plans"
import { PlanForm, type PlanFormValues } from "@/components/plan-form"
import { PlanDetailsView } from "@/components/plan-details/view"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

const plansRoute = "/plans" as Route

function toPriceUsd(priceUsdCents: number) {
  return priceUsdCents / 100
}

function getDefaultEditableValues(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    cpu: plan.cpu,
    cpuName: plan.cpuName,
    cpuThreads: plan.cpuThreads,
    ram: plan.ram,
    ramType: plan.ramType,
    storage: plan.storage,
    storageType: plan.storageType,
    bandwidth: plan.bandwidth,
    os: plan.os,
    osVersion: plan.osVersion,
    planType: plan.planType,
    portSpeed: plan.portSpeed,
    setupFees: plan.setupFees,
    planLocation: plan.planLocation,
    defaultPricingId: plan.defaultPricingId,
    pricingOptions: plan.pricingOptions.map((option) => ({
      pricingId: option.id,
      durationDays: option.durationDays,
      priceUsd: toPriceUsd(option.priceUsdCents),
      isActive: option.isActive,
    })),
  }
}

interface PlanDetailsProps {
  planId: number
}

export function PlanDetails({ planId }: PlanDetailsProps) {
  const { data: plans } = usePlans()
  const updatePlan = useUpdatePlan()
  const togglePlanStatus = useTogglePlanStatus()

  const plan = plans?.find((entry) => entry.id === planId)
  const [isEditing, setIsEditing] = useState(false)

  const handleFormSubmit = async (values: PlanFormValues) => {
    if (!plan) {
      return
    }

    await updatePlan.mutateAsync({
      planId: plan.id,
      data: {
        name: values.name,
        cpu: values.cpu,
        cpuName: values.cpuName,
        cpuThreads: values.cpuThreads,
        ram: values.ram,
        ramType: values.ramType,
        storage: values.storage,
        storageType: values.storageType,
        bandwidth: values.bandwidth,
        os: values.os,
        osVersion: values.osVersion,
        planType: values.planType,
        portSpeed: values.portSpeed,
        setupFees: values.setupFees,
        planLocation: values.planLocation,
        isActive: plan.isActive,
        isFeatured: plan.isFeatured,
        defaultPricingId: values.defaultPricingId ?? null,
        pricingOptions: values.pricingOptions.map((option) => ({
          id: option.pricingId,
          durationDays: option.durationDays,
          priceUsdCents: Math.round(option.priceUsd * 100),
          isActive: option.isActive ?? true,
        })),
      },
    })

    setIsEditing(false)
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div>Plan not found</div>
        <Link href={plansRoute}>
          <Button variant="outline">
            <HugeiconsIcon icon={ArrowLeft} strokeWidth={2} />
            Back to Plans
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={updatePlan.isPending}
              >
                <HugeiconsIcon
                  icon={PencilEdit02Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Edit
              </Button>
              <Button
                variant={plan.isActive ? "outline" : "default"}
                onClick={() =>
                  togglePlanStatus.mutate({
                    planId: plan.id,
                    isActive: !plan.isActive,
                  })
                }
                disabled={
                  togglePlanStatus.isPending &&
                  togglePlanStatus.variables?.planId === plan.id
                }
              >
                {togglePlanStatus.isPending &&
                togglePlanStatus.variables?.planId === plan.id ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                {plan.isActive ? "Deactivate" : "Activate"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="rounded-lg border bg-card p-6">
          <PlanForm
            mode="edit"
            defaultValues={getDefaultEditableValues(plan)}
            onSubmit={handleFormSubmit}
            isPending={updatePlan.isPending}
            showBackButton={false}
          />
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={updatePlan.isPending}
            >
              Cancel Edit
            </Button>
          </div>
        </div>
      ) : (
        <PlanDetailsView plan={plan} />
      )}
    </div>
  )
}
