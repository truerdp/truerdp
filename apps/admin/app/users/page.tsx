"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  DashboardSquare01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { AdminUserLink } from "@/components/admin-user-link"
import { useUsers } from "@/hooks/use-users"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy h:mm a")
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return format(date, "MMM d, yyyy")
}

function formatCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toLocaleString()} ${currency}`
  }
}

function getDisplayName(user: {
  firstName: string
  lastName: string
  email: string
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim()

  if (fullName) {
    return fullName
  }

  return user.email
}

function getRoleVariant(role: "user" | "operator" | "admin") {
  switch (role) {
    case "admin":
      return "default"
    case "operator":
      return "outline"
    default:
      return "secondary"
  }
}

function UsersSkeleton() {
  return (
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
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            {Array.from({ length: 7 }).map((__, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-4 w-28" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string
  value: string
  helper: string
}) {
  return (
    <Card className="border-border/60 bg-card/95">
      <CardContent>
        <div className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {title}
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">
          {value}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
      </CardContent>
    </Card>
  )
}

export default function AdminUsersPage() {
  const { data, isLoading, isError, error } = useUsers()
  const users = useMemo(() => data ?? [], [data])
  const [searchValue, setSearchValue] = useState("")

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase()

    return users.filter((user) => {
      if (!normalizedQuery) {
        return true
      }

      const searchableText = [
        user.id,
        user.email,
        user.firstName,
        user.lastName,
        user.role,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [searchValue, users])

  const totalRevenue = users.reduce(
    (sum, user) => sum + user.totalSpentCents,
    0
  )
  const payingUsers = users.filter((user) => user.totalSpentCents > 0).length
  const activeServiceOwners = users.filter(
    (user) => user.activeInstances > 0
  ).length

  return (
    <section className="min-w-0 space-y-6">
      <Card className="overflow-hidden border border-border/60 bg-linear-to-br from-primary/10 via-card to-primary/5 shadow-lg">
        <CardContent className="grid gap-6 py-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              <HugeiconsIcon
                icon={DashboardSquare01Icon}
                strokeWidth={2}
                className="size-4"
              />
              User Directory
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Browse every account, scan commercial health at a glance, and
                jump directly into the User 360 detail view.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              title="Accounts"
              value={`${users.length}`}
              helper="Total users in the system"
            />
            <MetricCard
              title="Paying Users"
              value={`${payingUsers}`}
              helper="Users with paid invoice history"
            />
            <MetricCard
              title="Live Revenue"
              value={formatCurrency(totalRevenue)}
              helper={`${activeServiceOwners} users currently have active services`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle>Directory</CardTitle>
            <CardDescription>
              Search by name, email, role, or ID to find an account quickly.
            </CardDescription>
          </div>
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search users by name, email, role, or ID"
            className="max-w-md"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <UsersSkeleton />
          ) : isError ? (
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm text-destructive">
              <HugeiconsIcon
                icon={Alert02Icon}
                strokeWidth={2}
                className="size-4"
              />
              <span>{error.message || "Failed to load users."}</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>No users match this search</EmptyTitle>
                <EmptyDescription>
                  Try a different name, email, role, or account ID.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <AdminUserLink
                          userId={user.id}
                          primary={getDisplayName(user)}
                          secondary={user.email}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">
                            {formatCurrency(user.totalSpentCents)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.confirmedTransactions}/
                            {user.totalTransactions} successful transactions
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">
                            {user.unpaidInvoices} unpaid / {user.totalInvoices}{" "}
                            total
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
                            {user.activeInstances} active /{" "}
                            {user.totalInstances} total
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
          )}
        </CardContent>
      </Card>
    </section>
  )
}
