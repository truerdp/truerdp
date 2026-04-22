"use client"

import { useRouter } from "next/navigation"
import { useCreatePlan } from "@/hooks/use-manage-plans"
import { PlanForm, type PlanFormValues } from "@/components/plan-form"

export default function CreatePlanPage() {
  const router = useRouter()
  const createPlan = useCreatePlan()

  const handleCreatePlan = async (values: PlanFormValues) => {
    await createPlan.mutateAsync({
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
      isActive: true,
      pricingOptions: values.pricingOptions.map((option) => ({
        durationDays: option.durationDays,
        priceUsdCents: Math.round(option.priceUsd * 100),
        isActive: option.isActive ?? true,
      })),
    })

    router.push("/plans")
  }

  return (
    <section className="space-y-6">
      <PlanForm
        mode="create"
        onSubmit={handleCreatePlan}
        isPending={createPlan.isPending}
      />
    </section>
  )
}
