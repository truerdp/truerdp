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
import { ArrowLeft, Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
  cpuName: "Intel Xeon",
  cpuThreads: 2,
  ram: 4,
  ramType: "DDR4",
  storage: 80,
  storageType: "SSD",
  bandwidth: "2TB",
  os: "Windows",
  osVersion: "Windows Server 2022",
  planType: "Dedicated",
  portSpeed: "1Gbps",
  setupFees: 0,
  planLocation: "USA",
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

            <Field data-invalid={!!errors.cpuThreads}>
              <FieldLabel htmlFor="plan-cpu-threads">CPU Threads</FieldLabel>
              <Input
                id="plan-cpu-threads"
                type="number"
                min={1}
                disabled={isPending}
                aria-invalid={!!errors.cpuThreads}
                {...register("cpuThreads", { valueAsNumber: true })}
              />
              {errors.cpuThreads && (
                <FieldError>{errors.cpuThreads.message}</FieldError>
              )}
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field data-invalid={!!errors.cpuName}>
              <FieldLabel htmlFor="plan-cpu-name">CPU Name</FieldLabel>
              <Input
                id="plan-cpu-name"
                type="text"
                disabled={isPending}
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
                disabled={isPending}
                aria-invalid={!!errors.ramType}
                {...register("ramType")}
              />
              {errors.ramType && (
                <FieldError>{errors.ramType.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.storageType}>
              <FieldLabel htmlFor="plan-storage-type">Storage Type</FieldLabel>
              <Controller
                control={control}
                name="storageType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
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
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field data-invalid={!!errors.bandwidth}>
              <FieldLabel htmlFor="plan-bandwidth">Bandwidth</FieldLabel>
              <Input
                id="plan-bandwidth"
                type="text"
                placeholder="2TB"
                disabled={isPending}
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
                placeholder="1Gbps"
                disabled={isPending}
                aria-invalid={!!errors.portSpeed}
                {...register("portSpeed")}
              />
              {errors.portSpeed && (
                <FieldError>{errors.portSpeed.message}</FieldError>
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
                disabled={isPending}
                aria-invalid={!!errors.setupFees}
                {...register("setupFees", { valueAsNumber: true })}
              />
              {errors.setupFees && (
                <FieldError>{errors.setupFees.message}</FieldError>
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field data-invalid={!!errors.os}>
              <FieldLabel htmlFor="plan-os">OS</FieldLabel>
              <Input
                id="plan-os"
                type="text"
                disabled={isPending}
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
                disabled={isPending}
                aria-invalid={!!errors.osVersion}
                {...register("osVersion")}
              />
              {errors.osVersion && (
                <FieldError>{errors.osVersion.message}</FieldError>
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
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="plan-type"
                      aria-invalid={!!errors.planType}
                    >
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dedicated">Dedicated</SelectItem>
                      <SelectItem value="Residential">Residential</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.planType && (
                <FieldError>{errors.planType.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.planLocation}>
              <FieldLabel htmlFor="plan-location">Plan Location</FieldLabel>
              <Input
                id="plan-location"
                type="text"
                placeholder="USA"
                disabled={isPending}
                aria-invalid={!!errors.planLocation}
                {...register("planLocation")}
              />
              {errors.planLocation && (
                <FieldError>{errors.planLocation.message}</FieldError>
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
