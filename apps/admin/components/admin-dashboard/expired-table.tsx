import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ExpiredStatusBadge } from "@/components/instance-status-badge"
import ExtendInstanceDialog from "@/components/extend-instance-dialog"
import TerminateInstanceDialog from "@/components/terminate-instance-dialog"
import {
  formatDate,
  getExpiredRowClassName,
} from "@/components/admin-dashboard/helpers"
import type { ExpiredInstance } from "@/hooks/use-expired-instances"

type ExpiredTableProps = {
  instances: ExpiredInstance[]
}

export function ExpiredTable({ instances }: ExpiredTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance ID</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Days Since Expiry</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((instance) => (
          <TableRow
            key={instance.id}
            className={cn(getExpiredRowClassName(instance.daysSinceExpiry))}
          >
            <TableCell className="font-mono text-sm">#{instance.id}</TableCell>
            <TableCell>{formatDate(instance.expiryDate)}</TableCell>
            <TableCell>
              <div className="flex gap-3">
                <span className="font-medium">{instance.daysSinceExpiry}</span>
                <ExpiredStatusBadge daysSinceExpiry={instance.daysSinceExpiry} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <ExtendInstanceDialog
                  instanceId={instance.id}
                  expiryDate={instance.expiryDate}
                />
                <TerminateInstanceDialog instanceId={instance.id} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

