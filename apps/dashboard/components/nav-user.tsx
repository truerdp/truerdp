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
  SparklesIcon,
  CheckmarkBadgeIcon,
  CreditCardIcon,
  NotificationIcon,
  LogoutIcon,
} from "@hugeicons/core-free-icons"
import { buildWebLoginUrl, logout } from "@/lib/auth"
import { dashboardPaths } from "@/lib/paths"

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
              <AvatarFallback>CN</AvatarFallback>
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
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  {menuUserText}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href={dashboardPaths.account} />}>
                <HugeiconsIcon icon={CheckmarkBadgeIcon} strokeWidth={2} />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
