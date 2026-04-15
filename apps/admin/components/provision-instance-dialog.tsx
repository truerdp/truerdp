"use client"

import { useState } from "react"
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
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@workspace/ui/components/field"
import {
  useProvisionInstance,
  type ProvisionRequest,
} from "@/hooks/use-provision-instance"

const provisionSchema = z.object({
  provider: z.string().min(1, "Provider is required"),
  externalId: z.string().optional(),
  ipAddress: z.string().min(1, "IP Address is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      provider: "manual",
      externalId: "",
      ipAddress: "",
      username: "",
      password: "",
    },
  })

  const onSubmit: SubmitHandler<ProvisionFormValues> = async (values) => {
    setIsSubmitting(true)
    try {
      const requestData: ProvisionRequest = {
        provider: values.provider,
        externalId: values.externalId || undefined,
        ipAddress: values.ipAddress,
        username: values.username,
        password: values.password,
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
            Enter the instance details to activate it for the user.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <FieldGroup className="gap-3 pb-6">
              <Field data-invalid={!!errors.provider}>
                <FieldLabel htmlFor="provider">Provider</FieldLabel>
                <Input
                  id="provider"
                  type="text"
                  placeholder="manual"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.provider}
                  {...register("provider")}
                />
                <FieldDescription>
                  Defaults to "manual" for self-hosted instances
                </FieldDescription>
                {errors.provider && (
                  <FieldError>{errors.provider.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.externalId}>
                <FieldLabel htmlFor="externalId">
                  External ID (optional)
                </FieldLabel>
                <Input
                  id="externalId"
                  type="text"
                  placeholder="e.g., aws-instance-i-1234567890"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.externalId}
                  {...register("externalId")}
                />
                <FieldDescription>
                  Provider-specific instance ID if applicable
                </FieldDescription>
                {errors.externalId && (
                  <FieldError>{errors.externalId.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.ipAddress}>
                <FieldLabel htmlFor="ipAddress">IP Address</FieldLabel>
                <Input
                  id="ipAddress"
                  type="text"
                  placeholder="e.g., 192.168.1.1"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.ipAddress}
                  {...register("ipAddress")}
                />
                <FieldDescription>
                  Public or private IP address of the instance
                </FieldDescription>
                {errors.ipAddress && (
                  <FieldError>{errors.ipAddress.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g., admin or root"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.username}
                  {...register("username")}
                />
                <FieldDescription>
                  SSH or access username for the instance
                </FieldDescription>
                {errors.username && (
                  <FieldError>{errors.username.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Provision Instance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
