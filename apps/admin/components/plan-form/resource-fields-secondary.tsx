import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Field, FieldError, FieldLabel } from "@workspace/ui/components/field"
import type { PlanFormValues } from "@/components/plan-form/schema"

type PlanResourceFieldsSecondaryProps = {
  register: UseFormRegister<PlanFormValues>
  control: Control<PlanFormValues>
  errors: FieldErrors<PlanFormValues>
  isPending: boolean
}

export function PlanResourceFieldsSecondary({
  register,
  control,
  errors,
  isPending,
}: PlanResourceFieldsSecondaryProps) {
  return (
    <>
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
          {errors.bandwidth && <FieldError>{errors.bandwidth.message}</FieldError>}
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
          {errors.portSpeed && <FieldError>{errors.portSpeed.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.setupFees}>
          <FieldLabel htmlFor="plan-setup-fees">Setup Fees (USD)</FieldLabel>
          <Input
            id="plan-setup-fees"
            type="number"
            min={0}
            disabled={isPending}
            aria-invalid={!!errors.setupFees}
            {...register("setupFees", { valueAsNumber: true })}
          />
          {errors.setupFees && <FieldError>{errors.setupFees.message}</FieldError>}
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
          {errors.osVersion && <FieldError>{errors.osVersion.message}</FieldError>}
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
                <SelectTrigger id="plan-type" aria-invalid={!!errors.planType}>
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dedicated">Dedicated</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.planType && <FieldError>{errors.planType.message}</FieldError>}
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
          {errors.planLocation && <FieldError>{errors.planLocation.message}</FieldError>}
        </Field>
      </div>
    </>
  )
}

