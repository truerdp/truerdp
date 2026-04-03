"use client"

import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Separator } from "@workspace/ui/components/separator"

interface CredentialsDialogProps {
  instanceId: number
}

interface InstanceCredentials {
  ipAddress: string | null
  username: string
  password: string
}

interface CredentialFieldProps {
  label: string
  value: string
  onCopy: () => Promise<void>
  copied: boolean
}

function CredentialField({
  label,
  value,
  onCopy,
  copied,
}: CredentialFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="truncate font-mono text-sm">{value}</span>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onCopy}>
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  )
}

export default function CredentialsDialog({
  instanceId,
}: CredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<
    "ipAddress" | "username" | "password" | null
  >(null)

  const credentialsMutation = useMutation<InstanceCredentials, Error>({
    mutationFn: async () => {
      const res = await api(`/instances/${instanceId}/credentials`, {
        method: "POST",
        body: JSON.stringify({ instanceId }),
      })

      return res as InstanceCredentials
    },
  })

  useEffect(() => {
    if (!copiedField) return
    const timeoutId = window.setTimeout(() => {
      setCopiedField(null)
    }, 1200)
    return () => window.clearTimeout(timeoutId)
  }, [copiedField])

  const copyToClipboard = async (
    field: "ipAddress" | "username" | "password",
    value: string
  ) => {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
  }

  const fetchCredentials = () => {
    setShowPassword(false)
    credentialsMutation.reset()
    credentialsMutation.mutate()
  }

  return (
    <Dialog>
      <DialogTrigger
        onClick={fetchCredentials}
        render={
          <Button
            variant="destructive"
            disabled={credentialsMutation.isPending}
          >
            {credentialsMutation.isPending && (
              <Spinner data-icon="inline-start" />
            )}
            Show Credentials
          </Button>
        }
      />

      <DialogContent className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Instance Credentials</DialogTitle>
          <DialogDescription>
            Credentials are hidden by default for security.
          </DialogDescription>
        </DialogHeader>

        {credentialsMutation.error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to fetch credentials</AlertTitle>
            <AlertDescription>
              {credentialsMutation.error.message ||
                "Failed to load credentials. Please try again."}
            </AlertDescription>
          </Alert>
        )}

        {credentialsMutation.isPending && !credentialsMutation.data ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Spinner />
            Loading credentials...
          </div>
        ) : credentialsMutation.data ? (
          <div className="flex flex-col gap-3">
            <CredentialField
              label="IP Address"
              value={credentialsMutation.data.ipAddress ?? "-"}
              copied={copiedField === "ipAddress"}
              onCopy={() =>
                copyToClipboard(
                  "ipAddress",
                  credentialsMutation.data.ipAddress ?? "-"
                )
              }
            />

            <Separator />

            <CredentialField
              label="Username"
              value={credentialsMutation.data.username}
              copied={copiedField === "username"}
              onCopy={() =>
                copyToClipboard("username", credentialsMutation.data.username)
              }
            />

            <Separator />

            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-xs text-muted-foreground">Password</span>
                <span className="truncate font-mono text-sm">
                  {showPassword
                    ? credentialsMutation.data.password
                    : "••••••••"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      "password",
                      credentialsMutation.data.password
                    )
                  }
                >
                  {copiedField === "password" ? "Copied" : "Copy"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Reveal"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No credentials available.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
