import { AlertCircle } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"

import { AdminUserLink } from "@/components/admin-user-link"
import TerminateInstanceDialog from "@/components/terminate-instance-dialog"
import { SuspendInstanceDialog } from "@/components/suspend-instance-dialog"
import type { InstanceDetailsData } from "@/components/instance-details/helpers"
import {
  formatDateTime,
  getStatusVariant,
} from "@/components/instance-details/helpers"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

type InstanceCardProps = {
  data: InstanceDetailsData
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ")
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-right text-sm">{value}</span>
      </div>
      <Separator />
    </>
  )
}

function TimelineRow({
  title,
  meta,
  description,
}: {
  title: string
  meta: string
  description: string
}) {
  return (
    <>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-muted-foreground">{meta}</span>
        </div>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Separator />
    </>
  )
}

export function InstanceCard({ data }: InstanceCardProps) {
  const { instance, plan, user, extensionHistory, statusEvents } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Instance #{instance.id}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(instance.status)} className="uppercase">
              Status: {formatStatus(instance.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        <Separator />
        <Row
          label="Customer"
          value={
            user ? (
              <AdminUserLink
                userId={user.id}
                primary={`${user.firstName} ${user.lastName}`.trim() || user.email}
                secondary={user.email}
              />
            ) : (
              "-"
            )
          }
        />
        <Row label="Plan" value={plan?.name ?? "-"} />
        <Row label="CPU" value={plan ? `${plan.cpu} cores` : "-"} />
        <Row label="RAM" value={plan ? `${plan.ram} GB` : "-"} />
        <Row label="Storage" value={plan ? `${plan.storage} GB` : "-"} />
        <Row label="Created" value={formatDateTime(instance.createdAt)} />
        <Row label="Start Date" value={formatDateTime(instance.startDate)} />
        <Row label="Expiry Date" value={formatDateTime(instance.expiryDate)} />
        <Row
          label="Terminated"
          value={formatDateTime(instance.terminatedAt)}
        />
        <Row
          label="Provision Attempts"
          value={String(instance.provisionAttempts)}
        />
        {instance.lastProvisionError ? (
          <Alert variant="destructive">
            <HugeiconsIcon icon={AlertCircle} className="size-4" />
            <AlertTitle>Last Provision Error</AlertTitle>
            <AlertDescription>{instance.lastProvisionError}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Extension History</div>
          {extensionHistory.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No extension actions recorded yet.
            </div>
          ) : (
            extensionHistory.map((event) => (
              <TimelineRow
                key={event.id}
                title={`+${event.daysExtended} days`}
                meta={formatDateTime(event.createdAt)}
                description={`Expiry: ${formatDateTime(
                  event.previousExpiryDate
                )} -> ${formatDateTime(event.newExpiryDate)} by ${
                  event.extendedBy
                    ? `${event.extendedBy.firstName} ${event.extendedBy.lastName} (${event.extendedBy.email})`
                    : "Unknown admin"
                }`}
              />
            ))
          )}
        </div>
        <Separator />
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">Status Audit Trail</div>
          {statusEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No status actions recorded yet.
            </div>
          ) : (
            statusEvents.map((event) => (
              <TimelineRow
                key={event.id}
                title={`${formatStatus(event.action)}: ${formatStatus(
                  event.fromStatus
                )} -> ${formatStatus(event.toStatus)}`}
                meta={formatDateTime(event.createdAt)}
                description={`${event.reason} - ${
                  event.admin
                    ? `${event.admin.firstName} ${event.admin.lastName} (${event.admin.email})`
                    : "Unknown admin"
                }`}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
