import type { ReactNode } from "react"

import type { InstanceDetailsData } from "@/components/instance-details/helpers"
import {
  formatDateTime,
  getResourceStatusVariant,
} from "@/components/instance-details/helpers"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"

type ResourceCardProps = {
  data: InstanceDetailsData
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

export function ResourceCard({ data }: ResourceCardProps) {
  const { resource, server } = data

  if (!resource) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={getResourceStatusVariant(resource.status)}
            className="uppercase"
          >
            {resource.status}
          </Badge>
          {server ? (
            <Badge variant="outline" className="uppercase">
              {server.status}
            </Badge>
          ) : null}
        </div>
        <Separator />
        <Row
          label="IP Address"
          value={<span className="font-mono">{server?.ipAddress ?? "-"}</span>}
        />
        <Row
          label="Username"
          value={<span className="font-mono">{resource.username ?? "-"}</span>}
        />
        <Row label="Provider" value={server?.provider ?? "-"} />
        <Row
          label="External ID"
          value={<span className="font-mono">{server?.externalId ?? "-"}</span>}
        />
        <Row label="Assigned At" value={formatDateTime(resource.assignedAt)} />
        <Row label="Released At" value={formatDateTime(resource.releasedAt)} />
        <Row label="Server CPU" value={server ? `${server.cpu} cores` : "-"} />
        <Row label="Server RAM" value={server ? `${server.ram} GB` : "-"} />
        <Row
          label="Server Storage"
          value={server ? `${server.storage} GB` : "-"}
        />
      </CardContent>
    </Card>
  )
}
