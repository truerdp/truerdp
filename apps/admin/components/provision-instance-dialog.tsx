"use client"

import { useState } from "react"
import { useForm, useWatch, type SubmitHandler } from "react-hook-form"
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
  SelectedServerDetails,
} from "@/components/provision-instance-dialog/selected-server-details"
import { ServerSelectField } from "@/components/provision-instance-dialog/server-select-field"
import {
  provisionSchema,
  type ProvisionFormValues,
} from "@/components/provision-instance-dialog/schema"
import {
  useProvisionInstance,
  type ProvisionRequest,
} from "@/hooks/use-provision-instance"
import { useAvailableServers } from "@/hooks/use-available-servers"

interface ProvisionInstanceDialogProps {
  open: boolean
  instanceId: number
  onOpenChange: (open: boolean) => void
}

export function ProvisionInstanceDialog({
  open,
  instanceId,
  onOpenChange,
}: ProvisionInstanceDialogProps) {
  const provisionMutation = useProvisionInstance()
  const serversQuery = useAvailableServers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      serverId: "",
      username: "",
      password: "",
    },
  })

  const selectedServerId = useWatch({
    control,
    name: "serverId",
    defaultValue: "",
  })
  const availableServers = serversQuery.data ?? []
  const selectedServer = availableServers.find(
    (server) => server.id === Number(selectedServerId)
  )

  const onSubmit: SubmitHandler<ProvisionFormValues> = async (values) => {
    setIsSubmitting(true)
    try {
      const requestData: ProvisionRequest = {
        serverId: Number(values.serverId),
        username: values.username || undefined,
        password: values.password || undefined,
      }

      await provisionMutation.mutateAsync({
        instanceId,
        data: requestData,
      })

      reset()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-4 overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Provision Instance #{instanceId}</DialogTitle>
          <DialogDescription>
            Select an available server to allocate to this instance.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <FieldGroup className="gap-3 pb-6">
              <ServerSelectField
                control={control}
                errors={errors}
                isSubmitting={isSubmitting}
                isLoading={serversQuery.isLoading}
                error={serversQuery.error}
                servers={availableServers}
              />

              {selectedServer ? (
                <SelectedServerDetails server={selectedServer} />
              ) : null}

              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username (optional)</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g., admin or root"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.username}
                  {...register("username")}
                />
                <FieldDescription>
                  SSH or access username if credentials differ from server
                  defaults
                </FieldDescription>
                {errors.username && (
                  <FieldError>{errors.username.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password (optional)</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <FieldDescription>
                  SSH or access password (encrypted in database)
                </FieldDescription>
                {errors.password && (
                  <FieldError>{errors.password.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter className="border-t px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedServerId ||
                serversQuery.isLoading ||
                availableServers.length === 0
              }
            >
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Provision Instance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
