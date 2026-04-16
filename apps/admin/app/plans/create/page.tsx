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
      ram: values.ram,
      storage: values.storage,
      isActive: true,
      pricingOptions: values.pricingOptions.map((option) => ({
        durationDays: option.durationDays,
        price: option.price,
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
