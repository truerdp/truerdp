import { Check } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import type { InstanceDetailsData } from "@/components/instance-details/helpers"
import { formatDateTime, getResourceStatusVariant } from "@/components/instance-details/helpers"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type ResourceCardProps = {
  data: InstanceDetailsData
}

export function ResourceCard({ data }: ResourceCardProps) {
  const { resource, server } = data

  if (!resource) {
    return null
  }

  return (
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
            {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-medium">Connection Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="mt-1 font-mono text-sm">{server?.ipAddress || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="mt-1 font-mono text-sm">{resource.username || "-"}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Provider Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Provider</p>
              <p className="mt-1 text-sm">{server?.provider || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">External ID</p>
              <p className="mt-1 font-mono text-sm">{server?.externalId || "-"}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium">Assignment Timeline</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Assigned At</p>
              <div className="mt-1 flex items-center gap-2">
                <HugeiconsIcon icon={Check} className="h-4 w-4 text-green-600" />
                <span className="text-sm">{formatDateTime(resource.assignedAt)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Released At</p>
              <p className="mt-1 text-sm">{formatDateTime(resource.releasedAt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
