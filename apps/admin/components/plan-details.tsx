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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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

function toPriceUsd(priceUsdCents: number) {
  return priceUsdCents / 100
}

const planFormSchema = z
  .object({
    name: z.string().trim().min(1, "Plan name is required"),
    cpu: z.number().int().positive("CPU must be greater than 0"),
    cpuName: z.string().trim().min(1, "CPU name is required"),
    cpuThreads: z.number().int().positive("CPU threads must be greater than 0"),
    ram: z.number().int().positive("RAM must be greater than 0"),
    ramType: z.string().trim().min(1, "RAM type is required"),
    storage: z.number().int().positive("Storage must be greater than 0"),
    storageType: z.enum(["HDD", "SSD"]),
    bandwidth: z.string().trim().min(1, "Bandwidth is required"),
    os: z.string().trim().min(1, "OS is required"),
    osVersion: z.string().trim().min(1, "OS version is required"),
    planType: z.enum(["Dedicated", "Residential"]),
    portSpeed: z.string().trim().min(1, "Port speed is required"),
    setupFees: z.number().int().nonnegative("Setup fees cannot be negative"),
    planLocation: z.string().trim().min(1, "Plan location is required"),
    defaultPricingId: z.number().int().positive().optional().nullable(),
    pricingOptions: z
      .array(
        z.object({
          pricingId: z.number().int().positive().optional(),
          durationDays: z
            .number()
            .int()
            .positive("Duration must be greater than 0"),
          priceUsd: z.number().nonnegative("Price cannot be negative"),
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

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatUsdFromCents(priceUsdCents: number) {
  return formatUsd(priceUsdCents / 100)
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
        defaultPricingId: values.defaultPricingId,
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
                    <div className="text-xs text-muted-foreground">
                      {plan.cpuName} • {plan.cpuThreads} threads
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-sm text-muted-foreground">RAM</div>
                    <div className="text-2xl font-bold">{plan.ram}</div>
                    <div className="text-xs text-muted-foreground">
                      GB • {plan.ramType}
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="text-sm text-muted-foreground">Storage</div>
                    <div className="text-2xl font-bold">{plan.storage}</div>
                    <div className="text-xs text-muted-foreground">
                      GB • {plan.storageType}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold">Catalog Metadata</h2>
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">Plan Type:</span>{" "}
                    {plan.planType}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">Location:</span>{" "}
                    {plan.planLocation}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">OS:</span> {plan.os}{" "}
                    {plan.osVersion}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">Bandwidth:</span>{" "}
                    {plan.bandwidth}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">Port Speed:</span>{" "}
                    {plan.portSpeed}
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <span className="text-muted-foreground">Setup Fees:</span>{" "}
                    {formatUsd(plan.setupFees)}
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
                            {formatUsdFromCents(pricing.priceUsdCents)}
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

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Field data-invalid={!!errors.cpuThreads}>
                  <FieldLabel htmlFor="plan-cpu-threads">
                    CPU Threads
                  </FieldLabel>
                  <Input
                    id="plan-cpu-threads"
                    type="number"
                    min={1}
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.cpuThreads}
                    {...register("cpuThreads", { valueAsNumber: true })}
                  />
                  {errors.cpuThreads && (
                    <FieldError>{errors.cpuThreads.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.cpuName}>
                  <FieldLabel htmlFor="plan-cpu-name">CPU Name</FieldLabel>
                  <Input
                    id="plan-cpu-name"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.cpuName}
                    {...register("cpuName")}
                  />
                  {errors.cpuName && (
                    <FieldError>{errors.cpuName.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.ramType}>
                  <FieldLabel htmlFor="plan-ram-type">RAM Type</FieldLabel>
                  <Input
                    id="plan-ram-type"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.ramType}
                    {...register("ramType")}
                  />
                  {errors.ramType && (
                    <FieldError>{errors.ramType.message}</FieldError>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Field data-invalid={!!errors.storageType}>
                  <FieldLabel htmlFor="plan-storage-type">
                    Storage Type
                  </FieldLabel>
                  <Controller
                    control={control}
                    name="storageType"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={updatePlan.isPending}
                      >
                        <SelectTrigger
                          id="plan-storage-type"
                          aria-invalid={!!errors.storageType}
                        >
                          <SelectValue placeholder="Select storage type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SSD">SSD</SelectItem>
                          <SelectItem value="HDD">HDD</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.storageType && (
                    <FieldError>{errors.storageType.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.planType}>
                  <FieldLabel htmlFor="plan-type">Plan Type</FieldLabel>
                  <Controller
                    control={control}
                    name="planType"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={updatePlan.isPending}
                      >
                        <SelectTrigger
                          id="plan-type"
                          aria-invalid={!!errors.planType}
                        >
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dedicated">Dedicated</SelectItem>
                          <SelectItem value="Residential">
                            Residential
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.planType && (
                    <FieldError>{errors.planType.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.planLocation}>
                  <FieldLabel htmlFor="plan-location">Location</FieldLabel>
                  <Input
                    id="plan-location"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.planLocation}
                    {...register("planLocation")}
                  />
                  {errors.planLocation && (
                    <FieldError>{errors.planLocation.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.setupFees}>
                  <FieldLabel htmlFor="plan-setup-fees">
                    Setup Fees (USD)
                  </FieldLabel>
                  <Input
                    id="plan-setup-fees"
                    type="number"
                    min={0}
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.setupFees}
                    {...register("setupFees", { valueAsNumber: true })}
                  />
                  {errors.setupFees && (
                    <FieldError>{errors.setupFees.message}</FieldError>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Field data-invalid={!!errors.bandwidth}>
                  <FieldLabel htmlFor="plan-bandwidth">Bandwidth</FieldLabel>
                  <Input
                    id="plan-bandwidth"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.bandwidth}
                    {...register("bandwidth")}
                  />
                  {errors.bandwidth && (
                    <FieldError>{errors.bandwidth.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.portSpeed}>
                  <FieldLabel htmlFor="plan-port-speed">Port Speed</FieldLabel>
                  <Input
                    id="plan-port-speed"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.portSpeed}
                    {...register("portSpeed")}
                  />
                  {errors.portSpeed && (
                    <FieldError>{errors.portSpeed.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.os}>
                  <FieldLabel htmlFor="plan-os">OS</FieldLabel>
                  <Input
                    id="plan-os"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.os}
                    {...register("os")}
                  />
                  {errors.os && <FieldError>{errors.os.message}</FieldError>}
                </Field>

                <Field data-invalid={!!errors.osVersion}>
                  <FieldLabel htmlFor="plan-os-version">OS Version</FieldLabel>
                  <Input
                    id="plan-os-version"
                    type="text"
                    disabled={updatePlan.isPending}
                    aria-invalid={!!errors.osVersion}
                    {...register("osVersion")}
                  />
                  {errors.osVersion && (
                    <FieldError>{errors.osVersion.message}</FieldError>
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
                      priceUsd: toPriceUsd(500),
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
                        data-invalid={
                          !!errors.pricingOptions?.[index]?.priceUsd
                        }
                      >
                        <FieldLabel htmlFor={`pricing-price-${index}`}>
                          Price (USD)
                        </FieldLabel>
                        <Input
                          id={`pricing-price-${index}`}
                          type="number"
                          min={0}
                          step="0.01"
                          disabled={updatePlan.isPending}
                          aria-invalid={
                            !!errors.pricingOptions?.[index]?.priceUsd
                          }
                          {...register(`pricingOptions.${index}.priceUsd`, {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.pricingOptions?.[index]?.priceUsd && (
                          <FieldError>
                            {errors.pricingOptions[index]?.priceUsd?.message}
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
