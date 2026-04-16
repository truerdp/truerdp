"use client"

import { format } from "date-fns"
import { AlertCircle, Check } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { useInstanceDetails } from "@/hooks/use-instance-details"

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "-"
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy HH:mm")
}

function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
      return "default"
    case "pending":
    case "provisioning":
      return "outline"
    case "expired":
    case "terminated":
    case "failed":
      return "destructive"
    case "termination_pending":
      return "secondary"
    default:
      return "secondary"
  }
}

function getResourceStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "running":
      return "default"
    case "creating":
      return "outline"
    case "stopped":
    case "failed":
    case "deleted":
      return "destructive"
    default:
      return "secondary"
  }
}

interface InstanceDetailsProps {
  instanceId: number
}

export function InstanceDetails({ instanceId }: InstanceDetailsProps) {
  const { data, isLoading, error } = useInstanceDetails(instanceId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircle} className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load instance details. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const { instance, plan, user, resource } = data

  return (
    <div className="space-y-6">
      {/* Instance Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Instance #{instance.id}</CardTitle>
              <CardDescription>
                Created on {formatDateTime(instance.createdAt)}
              </CardDescription>
            </div>
            <Badge variant={getStatusVariant(instance.status)}>
              {instance.status.charAt(0).toUpperCase() +
                instance.status.slice(1).replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div>
            <h3 className="mb-3 text-sm font-medium">User Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="mt-1 font-mono text-sm">{user?.email || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="mt-1 text-sm">
                  {user ? `${user.firstName} ${user.lastName}` : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Info */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Plan Information</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Plan Name</p>
                <p className="mt-1 text-sm font-medium">{plan?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPU</p>
                <p className="mt-1 text-sm">{plan?.cpu || "-"} cores</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RAM</p>
                <p className="mt-1 text-sm">{plan?.ram || "-"} GB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="mt-1 text-sm">{plan?.storage || "-"} GB</p>
              </div>
            </div>
          </div>

          {/* Instance Lifecycle */}
          <div>
            <h3 className="mb-3 text-sm font-medium">Instance Lifecycle</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="mt-1 text-sm">
                  {formatDateTime(instance.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expiry Date</p>
                <p className="mt-1 text-sm">
                  {formatDateTime(instance.expiryDate)}
                </p>
              </div>
              {instance.terminatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Terminated At</p>
                  <p className="mt-1 text-sm">
                    {formatDateTime(instance.terminatedAt)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">
                  Provision Attempts
                </p>
                <p className="mt-1 text-sm">{instance.provisionAttempts}</p>
              </div>
            </div>
            {instance.lastProvisionError && (
              <Alert variant="destructive" className="mt-3">
                <HugeiconsIcon icon={AlertCircle} className="h-4 w-4" />
                <AlertTitle>Last Provision Error</AlertTitle>
                <AlertDescription>
                  {instance.lastProvisionError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resource Info */}
      {resource && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Resource Information</CardTitle>
                <CardDescription>
                  Infrastructure and connectivity details
                </CardDescription>
              </div>
              <Badge variant={getResourceStatusVariant(resource.status)}>
                {resource.status.charAt(0).toUpperCase() +
                  resource.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Details */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Connection Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="mt-1 font-mono text-sm">
                    {resource.ipAddress || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="mt-1 font-mono text-sm">
                    {resource.username || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Provider Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="mt-1 text-sm">{resource.provider || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">External ID</p>
                  <p className="mt-1 font-mono text-sm">
                    {resource.externalId || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Health & Sync */}
            <div>
              <h3 className="mb-3 text-sm font-medium">Health & Sync</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Health Status</p>
                  <div className="mt-1 flex items-center gap-2">
                    {resource.healthStatus === "healthy" ? (
                      <>
                        <HugeiconsIcon
                          icon={Check}
                          className="h-4 w-4 text-green-600"
                        />
                        <span className="text-sm">Healthy</span>
                      </>
                    ) : (
                      <span className="text-sm">
                        {resource.healthStatus || "-"}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Synced</p>
                  <p className="mt-1 text-sm">
                    {formatDateTime(resource.lastSyncedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
