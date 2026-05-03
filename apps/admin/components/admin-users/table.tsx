import { AdminUserLink } from "@/components/admin-user-link"
import type { AdminUserSummary } from "@/hooks/use-users"
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  getDisplayName,
  getRoleVariant,
} from "@/components/admin-users/helpers"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

type AdminUsersTableProps = {
  users: AdminUserSummary[]
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Billing</TableHead>
            <TableHead>Activity</TableHead>
            <TableHead>Services</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <AdminUserLink
                  userId={user.id}
                  primary={getDisplayName(user)}
                  secondary={user.email}
                />
              </TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(user.role)}>{user.role}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {formatCurrency(user.totalSpentCents)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.confirmedTransactions}/{user.totalTransactions} successful
                    transactions
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm">
                    {user.unpaidInvoices} unpaid / {user.totalInvoices} total
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.hasBillingProfile
                      ? "Billing profile captured"
                      : "No billing profile yet"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(user.lastActivityAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="text-sm">
                    {user.activeInstances} active / {user.totalInstances} total
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.totalOrders} orders placed
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateOnly(user.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
