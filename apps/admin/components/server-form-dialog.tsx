"use client"

import { useEffect } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Spinner } from "@workspace/ui/components/spinner"
import { ServerFormFields } from "@/components/server-form-dialog/form-fields"
import {
  defaultServerFormValues,
  serverFormSchema,
  type ServerFormValues,
} from "@/components/server-form-dialog/schema"
import type {
  CreateServerInput,
  ServerInventoryItem,
} from "@/hooks/use-servers"

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
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServerFormValues>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: defaultServerFormValues,
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

    reset(defaultServerFormValues)
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
    reset(defaultServerFormValues)
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
            <ServerFormFields
              register={register}
              control={control}
              errors={errors}
              isPending={isPending}
            />
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
