"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { useSelectedLayoutSegments } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LayoutBottomIcon,
  DashboardSquare01Icon,
  ComputerTerminalIcon,
  Alert02Icon,
  CreditCardIcon,
  Package02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { adminPaths } from "@/lib/paths"
import { useProfile } from "@/hooks/use-profile"

const team = {
  name: "TrueRDP",
  logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
  plan: "Admin",
}

const navMain = [
  {
    title: "Overview",
    url: adminPaths.overview,
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
  },
  {
    title: "Instances",
    url: adminPaths.instances,
    icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
  },
  {
    title: "Users",
    url: adminPaths.users,
    icon: <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} />,
  },
  {
    title: "Plans",
    url: adminPaths.plans,
    icon: <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />,
  },
  {
    title: "Servers",
    url: adminPaths.servers,
    icon: <HugeiconsIcon icon={Package02Icon} strokeWidth={2} />,
  },
  {
    title: "Invoices",
    url: adminPaths.invoices,
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    title: "Transactions",
    url: adminPaths.transactions,
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    title: "Expired Instances",
    url: adminPaths.expiredInstances,
    icon: <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />,
  },
]

const fallbackAvatar = "/avatars/admin.jpg"

const data = {
  teams: [team],
  navMain,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const segments = useSelectedLayoutSegments()
  const profileName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`
    .trim()
    .replace(/\s+/g, " ")

  const user = {
    name: profileName,
    email: profile?.email ?? "",
    avatar: fallbackAvatar,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain.map((item) => ({
            ...item,
            isActive:
              (item.url === adminPaths.servers && segments[0] === "servers") ||
              (item.url === adminPaths.overview && segments.length === 0) ||
              (item.url === adminPaths.instances &&
                segments[0] === "instances" &&
                segments.length === 1) ||
              (item.url === adminPaths.users && segments[0] === "users") ||
              (item.url === adminPaths.plans && segments[0] === "plans") ||
              (item.url === adminPaths.invoices &&
                segments[0] === "invoices") ||
              (item.url === adminPaths.transactions &&
                segments[0] === "transactions") ||
              (item.url === adminPaths.expiredInstances &&
                segments[0] === "instances" &&
                segments[1] === "expired"),
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} isLoading={isProfileLoading} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
