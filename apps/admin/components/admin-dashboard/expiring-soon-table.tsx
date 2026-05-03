import { cn } from "@workspace/ui/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  ExpiringSoonStatusBadge,
} from "@/components/instance-status-badge"
import ExtendInstanceDialog from "@/components/extend-instance-dialog"
import {
  formatDate,
  getExpiringSoonRowClassName,
} from "@/components/admin-dashboard/helpers"
import type { ExpiringSoonInstance } from "@/hooks/use-expiring-soon-instances"

type ExpiringSoonTableProps = {
  instances: ExpiringSoonInstance[]
}

export function ExpiringSoonTable({ instances }: ExpiringSoonTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instance ID</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Days Until Expiry</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {instances.map((instance) => (
          <TableRow
            key={instance.id}
            className={cn(getExpiringSoonRowClassName(instance.daysUntilExpiry))}
          >
            <TableCell className="font-mono text-sm">#{instance.id}</TableCell>
            <TableCell>{formatDate(instance.expiryDate)}</TableCell>
            <TableCell>
              <div className="flex gap-3">
                <span className="font-medium">{instance.daysUntilExpiry}</span>
                <ExpiringSoonStatusBadge
                  daysUntilExpiry={instance.daysUntilExpiry}
                />
              </div>
            </TableCell>
            <TableCell>
              <ExtendInstanceDialog
                instanceId={instance.id}
                expiryDate={instance.expiryDate}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

