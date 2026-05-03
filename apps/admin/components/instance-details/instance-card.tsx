import { AlertCircle } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { AdminUserLink } from "@/components/admin-user-link"
import TerminateInstanceDialog from "@/components/terminate-instance-dialog"
import { SuspendInstanceDialog } from "@/components/suspend-instance-dialog"
import type { InstanceDetailsData } from "@/components/instance-details/helpers"
import { formatDateTime, getStatusVariant } from "@/components/instance-details/helpers"
import { Badge } from "@workspace/ui/components/badge"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type InstanceCardProps = {
  data: InstanceDetailsData
}

export function InstanceCard({ data }: InstanceCardProps) {
  const { instance, plan, user, extensionHistory, statusEvents } = data

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Instance #{instance.id}</CardTitle>
            <CardDescription>Created on {formatDateTime(instance.createdAt)}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(instance.status)}>
              {instance.status.charAt(0).toUpperCase() +
                instance.status.slice(1).replace(/_/g, " ")}
            </Badge>
            {instance.status !== "terminated" && (
              <TerminateInstanceDialog instanceId={instance.id} />
            )}
            {instance.status === "suspended" ? (
              <SuspendInstanceDialog instanceId={instance.id} mode="unsuspend" />
            ) : instance.status !== "terminated" ? (
              <SuspendInstanceDialog instanceId={instance.id} mode="suspend" />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium">User Information</h3>
          <div className="grid gap-4 sm:grid-cols-3">
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
            <div>
              <p className="text-xs text-muted-foreground">User 360</p>
              <div className="mt-1">
                {user ? (
                  <AdminUserLink userId={user.id} primary={`Open User #${user.id}`} />
                ) : (
                  <p className="text-sm">-</p>
                )}
              </div>
            </div>
          </div>
        </div>

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

        <div>
          <h3 className="mb-3 text-sm font-medium">Instance Lifecycle</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="mt-1 text-sm">{formatDateTime(instance.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expiry Date</p>
              <p className="mt-1 text-sm">{formatDateTime(instance.expiryDate)}</p>
            </div>
            {instance.terminatedAt ? (
              <div>
                <p className="text-xs text-muted-foreground">Terminated At</p>
                <p className="mt-1 text-sm">{formatDateTime(instance.terminatedAt)}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs text-muted-foreground">Provision Attempts</p>
              <p className="mt-1 text-sm">{instance.provisionAttempts}</p>
            </div>
          </div>
          {instance.lastProvisionError ? (
            <Alert variant="destructive" className="mt-3">
              <HugeiconsIcon icon={AlertCircle} className="h-4 w-4" />
              <AlertTitle>Last Provision Error</AlertTitle>
              <AlertDescription>{instance.lastProvisionError}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Extension History</h3>
          {extensionHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No extension actions recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {extensionHistory.map((event) => (
                <div key={event.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">+{event.daysExtended} days</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Expiry: {formatDateTime(event.previousExpiryDate)} -&gt;{" "}
                    {formatDateTime(event.newExpiryDate)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Extended by:{" "}
                    {event.extendedBy
                      ? `${event.extendedBy.firstName} ${event.extendedBy.lastName} (${event.extendedBy.email})`
                      : "Unknown admin"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Status Audit Trail</h3>
          {statusEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No status actions recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {statusEvents.map((event) => (
                <div key={event.id} className="rounded-lg border bg-muted/30 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">
                      {event.action.replaceAll("_", " ")}: {event.fromStatus} -&gt;{" "}
                      {event.toStatus}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{event.reason}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Admin:{" "}
                    {event.admin
                      ? `${event.admin.firstName} ${event.admin.lastName} (${event.admin.email})`
                      : "Unknown admin"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
