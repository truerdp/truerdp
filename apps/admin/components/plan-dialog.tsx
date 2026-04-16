"use client"

import { useEffect } from "react"
import {
  useFieldArray,
  useForm,
  Controller,
  type SubmitHandler,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
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

interface PlanDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  defaultValues?: PlanFormValues
  onSubmit: (values: PlanFormValues) => Promise<void>
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

export function PlanDialog({
  mode,
  open,
  onOpenChange,
  isPending,
  defaultValues,
  onSubmit,
}: PlanDialogProps) {
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pricingOptions",
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset(defaultValues ?? defaultFormValues)
  }, [defaultValues, open, reset])

  const handleFormSubmit: SubmitHandler<PlanFormValues> = async (values) => {
    await onSubmit(values)
  }

  const isEditMode = mode === "edit"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-5 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isEditMode ? "Edit Plan" : "Create Plan"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update compute resources and pricing options."
              : "Add a new plan with one or more pricing durations."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <FieldGroup className="gap-3 pb-6">
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

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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

              <Field>
                <FieldLabel>Pricing Options</FieldLabel>
                <FieldDescription>
                  Define subscription durations and prices in USD.
                </FieldDescription>
              </Field>

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

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => remove(index)}
                          disabled={isPending || fields.length === 1}
                        >
                          Remove
                        </Button>
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
                    <input
                      type="hidden"
                      {...register(`pricingOptions.${index}.isActive`)}
                      value={field.isActive ? "true" : "false"}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
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
                  Add pricing option
                </Button>
              </div>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              {isEditMode ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
