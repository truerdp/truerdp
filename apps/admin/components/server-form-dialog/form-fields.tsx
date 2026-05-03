import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { ServerFormValues } from "@/components/server-form-dialog/schema"

type ServerFormFieldsProps = {
  register: UseFormRegister<ServerFormValues>
  control: Control<ServerFormValues>
  errors: FieldErrors<ServerFormValues>
  isPending: boolean
}

export function ServerFormFields({
  register,
  control,
  errors,
  isPending,
}: ServerFormFieldsProps) {
  return (
    <FieldGroup className="grid gap-3 pb-6 md:grid-cols-2">
      <Field data-invalid={!!errors.provider}>
        <FieldLabel htmlFor="server-provider">Provider</FieldLabel>
        <Input id="server-provider" disabled={isPending} {...register("provider")} />
        <FieldDescription>Use manual for local inventory entries.</FieldDescription>
        {errors.provider && <FieldError>{errors.provider.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.status}>
        <FieldLabel htmlFor="server-status">Status</FieldLabel>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isPending}
            >
              <SelectTrigger id="server-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && <FieldError>{errors.status.message}</FieldError>}
      </Field>

      <Field className="md:col-span-2" data-invalid={!!errors.externalId}>
        <FieldLabel htmlFor="server-external-id">External ID (optional)</FieldLabel>
        <Input
          id="server-external-id"
          disabled={isPending}
          {...register("externalId")}
        />
        <FieldDescription>
          Cloud provider instance ID or asset identifier.
        </FieldDescription>
        {errors.externalId && <FieldError>{errors.externalId.message}</FieldError>}
      </Field>

      <Field className="md:col-span-2" data-invalid={!!errors.ipAddress}>
        <FieldLabel htmlFor="server-ip">IP Address</FieldLabel>
        <Input id="server-ip" disabled={isPending} {...register("ipAddress")} />
        {errors.ipAddress && <FieldError>{errors.ipAddress.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.cpu}>
        <FieldLabel htmlFor="server-cpu">CPU</FieldLabel>
        <Input
          id="server-cpu"
          type="number"
          min={1}
          disabled={isPending}
          {...register("cpu", { valueAsNumber: true })}
        />
        {errors.cpu && <FieldError>{errors.cpu.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.ram}>
        <FieldLabel htmlFor="server-ram">RAM (GB)</FieldLabel>
        <Input
          id="server-ram"
          type="number"
          min={1}
          disabled={isPending}
          {...register("ram", { valueAsNumber: true })}
        />
        {errors.ram && <FieldError>{errors.ram.message}</FieldError>}
      </Field>

      <Field data-invalid={!!errors.storage}>
        <FieldLabel htmlFor="server-storage">Storage (GB)</FieldLabel>
        <Input
          id="server-storage"
          type="number"
          min={1}
          disabled={isPending}
          {...register("storage", { valueAsNumber: true })}
        />
        {errors.storage && <FieldError>{errors.storage.message}</FieldError>}
      </Field>
    </FieldGroup>
  )
}

