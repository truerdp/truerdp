"use client"

import { Controller } from "react-hook-form"
import type {
  Control,
  FieldErrors,
  FieldArrayWithId,
  UseFieldArrayAppend,
  UseFormRegister,
} from "react-hook-form"
import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import type { PlanFormValues } from "@/components/plan-form"

interface PlanPricingOptionsFieldsProps {
  fields: FieldArrayWithId<PlanFormValues, "pricingOptions", "id">[]
  register: UseFormRegister<PlanFormValues>
  control: Control<PlanFormValues>
  errors: FieldErrors<PlanFormValues>
  append: UseFieldArrayAppend<PlanFormValues, "pricingOptions">
  isPending: boolean
  defaultPricingId?: number | null
  onSelectDefaultPricingId?: (pricingId: number) => void
}

export function PlanPricingOptionsFields({
  fields,
  register,
  control,
  errors,
  append,
  isPending,
  defaultPricingId,
  onSelectDefaultPricingId,
}: PlanPricingOptionsFieldsProps) {
  return (
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
              priceUsd: 0,
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
              <Field data-invalid={!!errors.pricingOptions?.[index]?.durationDays}>
                <FieldLabel htmlFor={`pricing-duration-${index}`}>
                  Duration (days)
                </FieldLabel>
                <Input
                  id={`pricing-duration-${index}`}
                  type="number"
                  min={1}
                  disabled={isPending}
                  aria-invalid={!!errors.pricingOptions?.[index]?.durationDays}
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

              <Field data-invalid={!!errors.pricingOptions?.[index]?.priceUsd}>
                <FieldLabel htmlFor={`pricing-price-${index}`}>
                  Price (USD)
                </FieldLabel>
                <Input
                  id={`pricing-price-${index}`}
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={isPending}
                  aria-invalid={!!errors.pricingOptions?.[index]?.priceUsd}
                  {...register(`pricingOptions.${index}.priceUsd`, {
                    valueAsNumber: true,
                  })}
                />
                {errors.pricingOptions?.[index]?.priceUsd && (
                  <FieldError>{errors.pricingOptions[index]?.priceUsd?.message}</FieldError>
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

              {onSelectDefaultPricingId ? (
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      defaultPricingId && field.pricingId === defaultPricingId
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      if (field.pricingId) {
                        onSelectDefaultPricingId(field.pricingId)
                      }
                    }}
                    disabled={isPending || !field.pricingId}
                  >
                    Default
                  </Button>
                </div>
              ) : null}
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
  )
}
