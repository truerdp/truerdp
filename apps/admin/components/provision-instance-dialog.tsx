"use client"

import { useState } from "react"
import {
  Controller,
  useForm,
  useWatch,
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
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  useProvisionInstance,
  type ProvisionRequest,
} from "@/hooks/use-provision-instance"
import { useAvailableServers } from "@/hooks/use-available-servers"

const provisionSchema = z.object({
  serverId: z.string().min(1, "Please select a server"),
  username: z.string().optional(),
  password: z.string().optional(),
})

type ProvisionFormValues = z.infer<typeof provisionSchema>

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

  const selectedServer = serversQuery.data?.find(
    (s) => s.id === Number(selectedServerId)
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
              <Field data-invalid={!!errors.serverId}>
                <FieldLabel htmlFor="serverId">Select Server</FieldLabel>
                {serversQuery.isLoading && (
                  <div className="flex items-center gap-2">
                    <Spinner data-icon="inline-start" />
                    <span className="text-sm text-muted-foreground">
                      Loading servers...
                    </span>
                  </div>
                )}

                {!serversQuery.isLoading && (
                  <Controller
                    control={control}
                    name="serverId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isSubmitting || serversQuery.isLoading}
                      >
                        <SelectTrigger
                          id="serverId"
                          aria-invalid={!!errors.serverId}
                        >
                          <SelectValue placeholder="Choose a server..." />
                        </SelectTrigger>
                        <SelectContent>
                          {serversQuery.data?.map((server) => (
                            <SelectItem key={server.id} value={String(server.id)}>
                              {server.ipAddress} - {server.cpu}vCPU, {server.ram}GB
                              RAM, {server.storage}GB Storage
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}

                <FieldDescription>
                  {serversQuery.data?.length === 0
                    ? "No servers available. Please add a server first."
                    : "Choose from available servers in your infrastructure"}
                </FieldDescription>

                {serversQuery.error && (
                  <FieldError>Failed to load servers</FieldError>
                )}
                {errors.serverId && (
                  <FieldError>{errors.serverId.message}</FieldError>
                )}
              </Field>

              {selectedServer && (
                <Field className="rounded-lg bg-secondary/50 p-3">
                  <FieldLabel className="text-sm font-medium">
                    Selected Server Details
                  </FieldLabel>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Provider:</span>
                      <span className="font-medium">
                        {selectedServer.provider}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono font-medium">
                        {selectedServer.ipAddress}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPU:</span>
                      <span className="font-medium">
                        {selectedServer.cpu} vCPU
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RAM:</span>
                      <span className="font-medium">
                        {selectedServer.ram} GB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage:</span>
                      <span className="font-medium">
                        {selectedServer.storage} GB
                      </span>
                    </div>
                  </div>
                </Field>
              )}

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
                (serversQuery.data?.length ?? 0) === 0
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
