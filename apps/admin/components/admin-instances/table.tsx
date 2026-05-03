import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"

import { AdminUserLink } from "@/components/admin-user-link"
import { adminPaths } from "@/lib/paths"
import type { Instance } from "@/hooks/use-all-instances"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  formatDateTime,
  formatStatus,
  getResourceStatusVariant,
  getStatusVariant,
} from "@/components/admin-instances/helpers"

type AdminInstancesTableProps = {
  instances: Instance[]
  onProvision: (instanceId: number) => void
  onTerminate: (instanceId: number) => void
  onSuspendToggle: (instanceId: number, mode: "suspend" | "unsuspend") => void
}

export function AdminInstancesTable({
  instances,
  onProvision,
  onTerminate,
  onSuspendToggle,
}: AdminInstancesTableProps) {
  const router = useRouter()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Instance</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Resource</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead className="w-40">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map((instance) => {
            const needsProvisioning =
              !instance.ipAddress || instance.status === "pending"

            return (
              <TableRow key={instance.id}>
                <TableCell>
                  <div className="font-mono text-sm">#{instance.id}</div>
                </TableCell>
                <TableCell>
                  <AdminUserLink
                    userId={instance.userId}
                    primary={`User #${instance.userId}`}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(instance.status)}>
                    {formatStatus(instance.status)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {instance.ipAddress || "-"}
                </TableCell>
                <TableCell>
                  {instance.resourceStatus ? (
                    <div className="flex flex-col gap-1">
                      <Badge variant={getResourceStatusVariant(instance.resourceStatus)}>
                        {formatStatus(instance.resourceStatus)}
                      </Badge>
                      {instance.provider && (
                        <span className="text-xs text-muted-foreground">
                          {instance.provider}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(instance.startDate)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col gap-1">
                    <span>{formatDateTime(instance.expiryDate)}</span>
                    {instance.extensionCount > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {instance.extensionCount} extension
                        {instance.extensionCount === 1 ? "" : "s"} •{" "}
                        {instance.lastExtensionDays
                          ? `last +${instance.lastExtensionDays}d`
                          : "latest extension"}
                        {instance.lastExtensionAt
                          ? ` on ${formatDateTime(instance.lastExtensionAt)}`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button size="icon-sm" variant="outline" />}>
                      <HugeiconsIcon
                        icon={MoreHorizontalCircle01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      <span className="sr-only">Open actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(adminPaths.instanceDetails(instance.id))
                        }
                      >
                        View
                      </DropdownMenuItem>
                      {needsProvisioning ? (
                        <DropdownMenuItem onClick={() => onProvision(instance.id)}>
                          Provision
                        </DropdownMenuItem>
                      ) : null}
                      {instance.status === "suspended" ? (
                        <DropdownMenuItem
                          onClick={() => onSuspendToggle(instance.id, "unsuspend")}
                        >
                          Undo suspension
                        </DropdownMenuItem>
                      ) : instance.status !== "terminated" ? (
                        <DropdownMenuItem
                          onClick={() => onSuspendToggle(instance.id, "suspend")}
                          variant="destructive"
                        >
                          Suspend
                        </DropdownMenuItem>
                      ) : null}
                      {instance.status !== "terminated" ? (
                        <DropdownMenuItem
                          onClick={() => onTerminate(instance.id)}
                          variant="destructive"
                        >
                          Terminate
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
