"use client"

import { useRouter } from "next/navigation"
import {
  useFieldArray,
  useForm,
  Controller,
  type SubmitHandler,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { ArrowLeft, Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const planFormSchema = z
  .object({
    name: z.string().trim().min(1, "Plan name is required"),
    cpu: z.number().int().positive("CPU must be greater than 0"),
    ram: z.number().int().positive("RAM must be greater than 0"),
    storage: z.number().int().positive("Storage must be greater than 0"),
    pricingOptions: z
      .array(
        z.object({
          pricingId: z.number().int().positive().optional(),
          durationDays: z
            .number()
            .int()
            .positive("Duration must be greater than 0"),
          price: z.number().int().nonnegative("Price cannot be negative"),
          isActive: z.boolean(),
        })
      )
      .min(1, "At least one pricing option is required"),
  })
  .superRefine((value, context) => {
    const seenDurations = new Set<number>()

    value.pricingOptions.forEach((option, index) => {
      if (seenDurations.has(option.durationDays)) {
        context.addIssue({
          code: "custom",
          path: ["pricingOptions", index, "durationDays"],
          message: "Each pricing duration must be unique",
        })
      }

      seenDurations.add(option.durationDays)
    })
  })

export type PlanFormValues = z.infer<typeof planFormSchema>

interface PlanFormProps {
  onSubmit: (values: PlanFormValues) => Promise<void>
  isPending: boolean
  mode?: "create" | "edit"
  defaultValues?: PlanFormValues
}

const defaultFormValues: PlanFormValues = {
  name: "",
  cpu: 2,
  ram: 4,
  storage: 80,
  pricingOptions: [
    {
      durationDays: 30,
      price: 500,
      pricingId: undefined,
      isActive: true,
    },
  ],
}

export function PlanForm({
  onSubmit,
  isPending,
  mode = "create",
  defaultValues,
}: PlanFormProps) {
  const router = useRouter()
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: defaultValues ?? defaultFormValues,
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
      </div>

      <div className="rounded-lg border border-border/70 bg-card p-6">
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="plan-name">Plan Name</FieldLabel>
            <Input
              id="plan-name"
              type="text"
              placeholder="Starter RDP"
              disabled={isPending}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field data-invalid={!!errors.cpu}>
              <FieldLabel htmlFor="plan-cpu">CPU</FieldLabel>
              <Input
                id="plan-cpu"
                type="number"
                min={1}
                disabled={isPending}
                aria-invalid={!!errors.cpu}
                {...register("cpu", { valueAsNumber: true })}
              />
              {errors.cpu && <FieldError>{errors.cpu.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.ram}>
              <FieldLabel htmlFor="plan-ram">RAM (GB)</FieldLabel>
              <Input
                id="plan-ram"
                type="number"
                min={1}
                disabled={isPending}
                aria-invalid={!!errors.ram}
                {...register("ram", { valueAsNumber: true })}
              />
              {errors.ram && <FieldError>{errors.ram.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.storage}>
              <FieldLabel htmlFor="plan-storage">Storage (GB)</FieldLabel>
              <Input
                id="plan-storage"
                type="number"
                min={1}
                disabled={isPending}
                aria-invalid={!!errors.storage}
                {...register("storage", { valueAsNumber: true })}
              />
              {errors.storage && (
                <FieldError>{errors.storage.message}</FieldError>
              )}
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="space-y-4 rounded-lg border border-border/70 bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <FieldLabel>Pricing Options</FieldLabel>
            <FieldDescription>
              Define subscription durations and prices in USD.
            </FieldDescription>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() =>
              append({
                durationDays: 30,
                price: 0,
                pricingId: undefined,
                isActive: true,
              })
            }
            disabled={isPending}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Add Pricing Option
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-2xl border border-border/70 bg-muted/30 p-4"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Field
                  data-invalid={!!errors.pricingOptions?.[index]?.durationDays}
                >
                  <FieldLabel htmlFor={`pricing-duration-${index}`}>
                    Duration (days)
                  </FieldLabel>
                  <Input
                    id={`pricing-duration-${index}`}
                    type="number"
                    min={1}
                    disabled={isPending}
                    aria-invalid={
                      !!errors.pricingOptions?.[index]?.durationDays
                    }
                    {...register(`pricingOptions.${index}.durationDays`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.pricingOptions?.[index]?.durationDays && (
                    <FieldError>
                      {errors.pricingOptions[index]?.durationDays?.message}
                    </FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.pricingOptions?.[index]?.price}>
                  <FieldLabel htmlFor={`pricing-price-${index}`}>
                    Price (USD)
                  </FieldLabel>
                  <Input
                    id={`pricing-price-${index}`}
                    type="number"
                    min={0}
                    disabled={isPending}
                    aria-invalid={!!errors.pricingOptions?.[index]?.price}
                    {...register(`pricingOptions.${index}.price`, {
                      valueAsNumber: true,
                    })}
                  />
                  {errors.pricingOptions?.[index]?.price && (
                    <FieldError>
                      {errors.pricingOptions[index]?.price?.message}
                    </FieldError>
                  )}
                </Field>

                <div className="flex flex-col gap-1">
                  <FieldLabel>Active</FieldLabel>
                  <div className="flex h-10 items-center">
                    <Controller
                      control={control}
                      name={`pricingOptions.${index}.isActive`}
                      render={({ field: { value, onChange } }) => (
                        <Switch
                          checked={value}
                          onCheckedChange={onChange}
                          disabled={isPending}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              {field.pricingId ? (
                <input
                  type="hidden"
                  {...register(`pricingOptions.${index}.pricingId`, {
                    valueAsNumber: true,
                  })}
                  defaultValue={field.pricingId}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

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
