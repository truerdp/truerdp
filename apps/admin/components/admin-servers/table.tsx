import { cn } from "@workspace/ui/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import type { ServerInventoryItem } from "@/hooks/use-servers"
import {
  formatDateTime,
  formatStatus,
  getStatusVariant,
} from "@/components/admin-servers/helpers"

type AdminServersTableProps = {
  servers: ServerInventoryItem[]
  isPending: boolean
  onSetStatus: (serverId: number, status: ServerInventoryItem["status"]) => void
}

export function AdminServersTable({
  servers,
  isPending,
  onSetStatus,
}: AdminServersTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Server</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Specs</TableHead>
            <TableHead>Assignment</TableHead>
            <TableHead>Last Assigned</TableHead>
            <TableHead className="w-[320px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow
              key={server.id}
              className={cn(server.status === "retired" && "opacity-70")}
            >
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm font-medium">
                    {server.ipAddress}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {server.provider}
                    {server.externalId ? ` · ${server.externalId}` : ""}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(server.status)}>
                  {formatStatus(server.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm text-muted-foreground">
                  {server.cpu} vCPU · {server.ram} GB RAM · {server.storage} GB
                  {" "}Storage
                </div>
              </TableCell>
              <TableCell>
                {server.activeInstanceId ? (
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">Instance #{server.activeInstanceId}</div>
                    <div className="text-xs text-muted-foreground">
                      Resource #{server.activeResourceId}{" "}
                      {server.activeResourceUsername
                        ? `· ${server.activeResourceUsername}`
                        : ""}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Not assigned</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(server.lastAssignedAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={server.status === "available" ? "default" : "outline"}
                    onClick={() => onSetStatus(server.id, "available")}
                    disabled={isPending || server.status === "available"}
                  >
                    Available
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={server.status === "cleaning" ? "default" : "outline"}
                    onClick={() => onSetStatus(server.id, "cleaning")}
                    disabled={isPending || server.status === "cleaning"}
                  >
                    Cleaning
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={server.status === "retired" ? "destructive" : "outline"}
                    onClick={() => onSetStatus(server.id, "retired")}
                    disabled={isPending || server.status === "retired"}
                  >
                    Retire
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
