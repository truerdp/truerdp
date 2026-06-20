"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UnfoldMoreIcon,
  CheckmarkBadgeIcon,
  LogoutIcon,
  Moon02Icon,
  Sun02Icon,
} from "@hugeicons/core-free-icons"
import { buildWebLoginUrl, logout } from "@/lib/auth"
import { dashboardPaths } from "@/lib/paths"
import { useTheme } from "@/components/theme-provider"
import { useImpersonation } from "@/hooks/use-impersonation"
import { clientApi } from "@workspace/api/client"
import { queryKeys } from "@/lib/query-keys"

function getAdminUserUrl(customerId: number) {
  const adminBase =
    process.env.NEXT_PUBLIC_ADMIN_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3002"
      : "/admin")

  return `${adminBase.replace(/\/$/, "")}/users/${customerId}`
}

export function NavUser({
  user,
  isLoading = false,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  isLoading?: boolean
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isExitingImpersonation, setIsExitingImpersonation] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const { data: impersonation } = useImpersonation()

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await logout()
      await queryClient.invalidateQueries()
      window.location.replace(buildWebLoginUrl(window.location.href))
    } finally {
      setIsLoggingOut(false)
      router.refresh()
    }
  }

  async function handleExitImpersonation() {
    if (!impersonation?.active) {
      return
    }

    try {
      setIsExitingImpersonation(true)
      await clientApi("/impersonation/current", { method: "DELETE" })
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile() })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.impersonation(),
      })
      window.location.assign(getAdminUserUrl(impersonation.customer.id))
    } finally {
      setIsExitingImpersonation(false)
      router.refresh()
    }
  }

  const userText = isLoading ? (
    <div className="grid flex-1 gap-1 text-left">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  ) : (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  )

  const menuUserText = isLoading ? (
    <div className="grid flex-1 gap-1 text-left">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  ) : (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-medium">{user.name}</span>
      <span className="truncate text-xs">{user.email}</span>
    </div>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {userText}
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              strokeWidth={2}
              className="ml-auto"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {menuUserText}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href={dashboardPaths.account} />}>
                <HugeiconsIcon icon={CheckmarkBadgeIcon} strokeWidth={2} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                <HugeiconsIcon
                  icon={isDark ? Sun02Icon : Moon02Icon}
                  strokeWidth={2}
                />
                {isDark ? "Switch to light mode" : "Switch to dark mode"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {impersonation?.active ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExitImpersonation}
                  disabled={isExitingImpersonation}
                >
                  <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
                  Exit Impersonation
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
