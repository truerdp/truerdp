"use client"

import { useState } from "react"
import Link from "next/link"
import {
  useFieldArray,
  useForm,
  Controller,
  type SubmitHandler,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { usePlans, type Plan } from "@/hooks/use-plans"
import { useUpdatePlan, useTogglePlanStatus } from "@/hooks/use-manage-plans"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Spinner } from "@workspace/ui/components/spinner"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  ArrowLeft,
  PencilEdit02Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const planFormSchema = z
  .object({
    name: z.string().trim().min(1, "Plan name is required"),
    cpu: z.number().int().positive("CPU must be greater than 0"),
    ram: z.number().int().positive("RAM must be greater than 0"),
    storage: z.number().int().positive("Storage must be greater than 0"),
    defaultPricingId: z.number().int().positive().optional().nullable(),
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

type PlanFormValues = z.infer<typeof planFormSchema>

function getDefaultEditableValues(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    cpu: plan.cpu,
    ram: plan.ram,
    storage: plan.storage,
    defaultPricingId: plan.defaultPricingId,
    pricingOptions: plan.pricingOptions.map((option) => ({
      pricingId: option.id,
      durationDays: option.durationDays,
      price: option.price,
      isActive: option.isActive,
    })),
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price)
}

interface PlanDetailsProps {
  planId: number
}

export function PlanDetails({ planId }: PlanDetailsProps) {
  const { data: plans } = usePlans()
  const updatePlan = useUpdatePlan()
  const togglePlanStatus = useTogglePlanStatus()

  const plan = plans?.find((p) => p.id === planId)
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    control,
    reset,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: plan ? getDefaultEditableValues(plan) : undefined,
  })

  const { fields, append } = useFieldArray({
    control,
    name: "pricingOptions",
  })

  const handleFormSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    if (!plan) return

    await updatePlan.mutateAsync({
      planId: plan.id,
      data: {
        name: values.name,
        cpu: values.cpu,
        ram: values.ram,
        storage: values.storage,
        isActive: plan.isActive,
        defaultPricingId: values.defaultPricingId,
        pricingOptions: values.pricingOptions.map((option) => ({
          id: option.pricingId,
          durationDays: option.durationDays,
          price: option.price,
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
        <Link href={"/plans" as any}>
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
          {!isEditing && (
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
          )}
        </div>
      </div>

      {!isEditing ? (
        // View Mode
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold">{plan.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Plan ID #{plan.id}
                </p>
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
                    <div className="text-xs text-muted-foreground">vCores</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-sm text-muted-foreground">RAM</div>
                    <div className="text-2xl font-bold">{plan.ram}</div>
                    <div className="text-xs text-muted-foreground">GB</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-sm text-muted-foreground">Storage</div>
                    <div className="text-2xl font-bold">{plan.storage}</div>
                    <div className="text-xs text-muted-foreground">GB</div>
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
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {pricing.durationDays} days
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Duration
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatPrice(pricing.price)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per duration
                          </div>
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
      ) : (
        // Edit Mode
        <div className="rounded-lg border bg-card p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <FieldGroup className="gap-3">
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="plan-name">Plan Name</FieldLabel>
                <Input
                  id="plan-name"
                  type="text"
                  placeholder="Starter RDP"
                  disabled={updatePlan.isPending}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </Field>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field data-invalid={!!errors.cpu}>
                  <FieldLabel htmlFor="plan-cpu">CPU</FieldLabel>
                  <Input
                    id="plan-cpu"
                    type="number"
                    min={1}
                    disabled={updatePlan.isPending}
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
                    disabled={updatePlan.isPending}
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
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.storage}
                    {...register("storage", { valueAsNumber: true })}
                  />
                  {errors.storage && (
                    <FieldError>{errors.storage.message}</FieldError>
                  )}
                </Field>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel>Pricing Options</FieldLabel>
                  <FieldDescription>
                    Define subscription durations and prices in USD.
                  </FieldDescription>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    const newOption: PlanFormValues["pricingOptions"][0] = {
                      durationDays: 30,
                      price: 500,
                      isActive: true,
                    }
                    append(newOption)
                  }}
                  disabled={updatePlan.isPending}
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Add Option
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-2xl border border-border/70 bg-muted/30 p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                      <Field
                        data-invalid={
                          !!errors.pricingOptions?.[index]?.durationDays
                        }
                      >
                        <FieldLabel htmlFor={`pricing-duration-${index}`}>
                          Duration (days)
                        </FieldLabel>
                        <Input
                          id={`pricing-duration-${index}`}
                          type="number"
                          min={1}
                          disabled={updatePlan.isPending}
                          aria-invalid={
                            !!errors.pricingOptions?.[index]?.durationDays
                          }
                          {...register(`pricingOptions.${index}.durationDays`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.pricingOptions?.[index]?.durationDays && (
                          <FieldError>
                            {
                              errors.pricingOptions[index]?.durationDays
                                ?.message
                            }
                          </FieldError>
                        )}
                      </Field>

                      <Field
                        data-invalid={!!errors.pricingOptions?.[index]?.price}
                      >
                        <FieldLabel htmlFor={`pricing-price-${index}`}>
                          Price (USD)
                        </FieldLabel>
                        <Input
                          id={`pricing-price-${index}`}
                          type="number"
                          min={0}
                          disabled={updatePlan.isPending}
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

                      <Field>
                        <FieldLabel>Active</FieldLabel>
                        <Controller
                          control={control}
                          name={`pricingOptions.${index}.isActive`}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) =>
                                field.onChange(checked)
                              }
                              disabled={updatePlan.isPending}
                            />
                          )}
                        />
                      </Field>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          variant={
                            watch("defaultPricingId") ===
                            watch(`pricingOptions.${index}.pricingId`)
                              ? "default"
                              : "outline"
                          }
                          onClick={() => {
                            const pricingId = watch(
                              `pricingOptions.${index}.pricingId`
                            )
                            if (pricingId) {
                              setValue("defaultPricingId", pricingId)
                            }
                          }}
                          disabled={updatePlan.isPending}
                          title="Set as default pricing"
                        >
                          Default
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FieldGroup>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  reset()
                }}
                disabled={updatePlan.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlan.isPending}>
                {updatePlan.isPending && <Spinner data-icon="inline-start" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
