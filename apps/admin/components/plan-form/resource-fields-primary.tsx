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

type PlanResourceFieldsPrimaryProps = {
  register: UseFormRegister<PlanFormValues>
  control: Control<PlanFormValues>
  errors: FieldErrors<PlanFormValues>
  isPending: boolean
}

export function PlanResourceFieldsPrimary({
  register,
  control,
  errors,
  isPending,
}: PlanResourceFieldsPrimaryProps) {
  return (
    <>
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
          {errors.cpuThreads && <FieldError>{errors.cpuThreads.message}</FieldError>}
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
          {errors.storage && <FieldError>{errors.storage.message}</FieldError>}
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
          {errors.cpuName && <FieldError>{errors.cpuName.message}</FieldError>}
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
          {errors.ramType && <FieldError>{errors.ramType.message}</FieldError>}
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
                <SelectTrigger id="plan-storage-type" aria-invalid={!!errors.storageType}>
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SSD">SSD</SelectItem>
                  <SelectItem value="HDD">HDD</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.storageType && <FieldError>{errors.storageType.message}</FieldError>}
        </Field>
      </div>
    </>
  )
}
