import { Controller, type Control, type FieldErrors } from "react-hook-form"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { ProvisionFormValues } from "@/components/provision-instance-dialog/schema"
import type { Server } from "@/hooks/use-available-servers"

type ServerSelectFieldProps = {
  control: Control<ProvisionFormValues>
  errors: FieldErrors<ProvisionFormValues>
  isSubmitting: boolean
  isLoading: boolean
  error: Error | null
  servers: Server[]
}

export function ServerSelectField({
  control,
  errors,
  isSubmitting,
  isLoading,
  error,
  servers,
}: ServerSelectFieldProps) {
  return (
    <Field data-invalid={!!errors.serverId}>
      <FieldLabel htmlFor="serverId">Select Server</FieldLabel>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Spinner data-icon="inline-start" />
          <span className="text-sm text-muted-foreground">Loading servers...</span>
        </div>
      ) : (
        <Controller
          control={control}
          name="serverId"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger id="serverId" aria-invalid={!!errors.serverId}>
                <SelectValue placeholder="Choose a server..." />
              </SelectTrigger>
              <SelectContent>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={String(server.id)}>
                    {server.ipAddress} - {server.cpu}vCPU, {server.ram}GB RAM,{" "}
                    {server.storage}GB Storage
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      )}

      <FieldDescription>
        {servers.length === 0
          ? "No servers available. Please add a server first."
          : "Choose from available servers in your infrastructure"}
      </FieldDescription>

      {error && <FieldError>Failed to load servers</FieldError>}
      {errors.serverId && <FieldError>{errors.serverId.message}</FieldError>}
    </Field>
  )
}
