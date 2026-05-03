import type { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import { FieldGroup } from "@workspace/ui/components/field"
import { PlanResourceFieldsPrimary } from "@/components/plan-form/resource-fields-primary"
import { PlanResourceFieldsSecondary } from "@/components/plan-form/resource-fields-secondary"
import type { PlanFormValues } from "@/components/plan-form/schema"

type PlanResourceFieldsProps = {
  register: UseFormRegister<PlanFormValues>
  control: Control<PlanFormValues>
  errors: FieldErrors<PlanFormValues>
  isPending: boolean
}

export function PlanResourceFields({
  register,
  control,
  errors,
  isPending,
}: PlanResourceFieldsProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-6">
      <FieldGroup className="gap-4">
        <PlanResourceFieldsPrimary
          register={register}
          control={control}
          errors={errors}
          isPending={isPending}
        />
        <PlanResourceFieldsSecondary
          register={register}
          control={control}
          errors={errors}
          isPending={isPending}
        />
      </FieldGroup>
    </div>
  )
}

