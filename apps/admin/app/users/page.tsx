"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"

import { useUsers } from "@/hooks/use-users"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { formatCurrency } from "@/components/admin-users/helpers"
import { MetricCard, UsersEmpty, UsersSkeleton } from "@/components/admin-users/states"
import { AdminUsersTable } from "@/components/admin-users/table"

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
            <UsersEmpty />
          ) : (
            <AdminUsersTable users={filteredUsers} />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
