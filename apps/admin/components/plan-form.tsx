"use client"

import { useRouter } from "next/navigation"
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { ArrowLeft } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlanPricingOptionsFields } from "@/components/plan-pricing-options-fields"
import { PlanResourceFields } from "@/components/plan-form/resource-fields"
import {
  defaultPlanFormValues,
  planFormSchema,
  type PlanFormValues,
} from "@/components/plan-form/schema"

interface PlanFormProps {
  onSubmit: (values: PlanFormValues) => Promise<void>
  isPending: boolean
  mode?: "create" | "edit"
  defaultValues?: PlanFormValues
  showBackButton?: boolean
}

export type { PlanFormValues } from "@/components/plan-form/schema"

export function PlanForm({
  onSubmit,
  isPending,
  mode = "create",
  defaultValues,
  showBackButton = true,
}: PlanFormProps) {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: defaultValues ?? defaultPlanFormValues,
  })

  const { fields, append } = useFieldArray({
    control,
    name: "pricingOptions",
  })

  const handleFormSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    await onSubmit(values)
  }

  const isEditMode = mode === "edit"

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Plan" : "Create Plan"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Update compute resources and pricing options."
              : "Add a new plan with one or more pricing durations."}
          </p>
        </div>
        {showBackButton ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            <HugeiconsIcon
              icon={ArrowLeft}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back
          </Button>
        ) : null}
      </div>

      <PlanResourceFields
        register={register}
        control={control}
        errors={errors}
        isPending={isPending}
      />

      <PlanPricingOptionsFields
        fields={fields}
        register={register}
        control={control}
        errors={errors}
        append={append}
        isPending={isPending}
        defaultPricingId={watch("defaultPricingId")}
        onSelectDefaultPricingId={
          isEditMode
            ? (pricingId) => {
                setValue("defaultPricingId", pricingId)
              }
            : undefined
        }
      />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isEditMode ? "Save Changes" : "Create Plan"}
        </Button>
      </div>
    </form>
  )
}
