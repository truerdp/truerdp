"use client"

import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
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
import type {
  CreateServerInput,
  ServerInventoryItem,
} from "@/hooks/use-servers"

const serverFormSchema = z.object({
  provider: z.string().trim().min(1, "Provider is required"),
  externalId: z.string().trim().optional(),
  ipAddress: z.string().trim().min(1, "IP address is required"),
  cpu: z.number().int().positive("CPU must be greater than 0"),
  ram: z.number().int().positive("RAM must be greater than 0"),
  storage: z.number().int().positive("Storage must be greater than 0"),
  status: z.enum(["available", "assigned", "cleaning", "retired"]),
})

type ServerFormValues = z.infer<typeof serverFormSchema>

const defaultValues: ServerFormValues = {
  provider: "manual",
  externalId: "",
  ipAddress: "",
  cpu: 2,
  ram: 4,
  storage: 80,
  status: "available",
}

interface ServerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onSubmit: (input: CreateServerInput) => Promise<void>
  defaultValue?: ServerInventoryItem | null
}

export function ServerFormDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
  defaultValue,
}: ServerFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (defaultValue) {
      reset({
        provider: defaultValue.provider,
        externalId: defaultValue.externalId ?? "",
        ipAddress: defaultValue.ipAddress,
        cpu: defaultValue.cpu,
        ram: defaultValue.ram,
        storage: defaultValue.storage,
        status: defaultValue.status,
      })
      return
    }

    reset(defaultValues)
  }, [defaultValue, open, reset])

  const submitHandler: SubmitHandler<ServerFormValues> = async (values) => {
    await onSubmit({
      provider: values.provider,
      externalId: values.externalId?.trim() || null,
      ipAddress: values.ipAddress,
      cpu: values.cpu,
      ram: values.ram,
      storage: values.storage,
      status: values.status,
    })
    reset(defaultValues)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-5 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Add Server</DialogTitle>
          <DialogDescription>
            Register a physical or virtual server in the inventory pool.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(submitHandler)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <FieldGroup className="grid gap-3 pb-6 md:grid-cols-2">
              <Field data-invalid={!!errors.provider}>
                <FieldLabel htmlFor="server-provider">Provider</FieldLabel>
                <Input
                  id="server-provider"
                  disabled={isPending}
                  {...register("provider")}
                />
                <FieldDescription>
                  Use manual for local inventory entries.
                </FieldDescription>
                {errors.provider && (
                  <FieldError>{errors.provider.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.status}>
                <FieldLabel htmlFor="server-status">Status</FieldLabel>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    reset({
                      ...watch(),
                      status: value as ServerFormValues["status"],
                    })
                  }
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
                {errors.status && (
                  <FieldError>{errors.status.message}</FieldError>
                )}
              </Field>

              <Field
                className="md:col-span-2"
                data-invalid={!!errors.externalId}
              >
                <FieldLabel htmlFor="server-external-id">
                  External ID (optional)
                </FieldLabel>
                <Input
                  id="server-external-id"
                  disabled={isPending}
                  {...register("externalId")}
                />
                <FieldDescription>
                  Cloud provider instance ID or asset identifier.
                </FieldDescription>
                {errors.externalId && (
                  <FieldError>{errors.externalId.message}</FieldError>
                )}
              </Field>

              <Field
                className="md:col-span-2"
                data-invalid={!!errors.ipAddress}
              >
                <FieldLabel htmlFor="server-ip">IP Address</FieldLabel>
                <Input
                  id="server-ip"
                  disabled={isPending}
                  {...register("ipAddress")}
                />
                {errors.ipAddress && (
                  <FieldError>{errors.ipAddress.message}</FieldError>
                )}
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
                {errors.storage && (
                  <FieldError>{errors.storage.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t px-6 py-4 sm:justify-end">
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
              Save Server
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
