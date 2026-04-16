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
  CreditCardIcon,
} from "@hugeicons/core-free-icons"
import { dashboardPaths } from "@/lib/paths"
import { useProfile } from "@/hooks/use-profile"

const team = {
  name: "TrueRDP",
  logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
  plan: "Dashboard",
}

const navMain = [
  {
    title: "Overview",
    url: dashboardPaths.overview,
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
  },
  {
    title: "Instances",
    url: dashboardPaths.instances,
    icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
  },
  {
    title: "Transactions",
    url: dashboardPaths.transactions,
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
  {
    title: "Invoices",
    url: dashboardPaths.invoices,
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
]

const fallbackAvatar = "/avatars/shadcn.jpg"

const data = {
  teams: [team],
  navMain,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile, isLoading: isProfileLoading } = useProfile()
  const segments = useSelectedLayoutSegments()
  const primarySegment = segments[0]
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
              (item.url === dashboardPaths.overview && segments.length === 0) ||
              (item.url === dashboardPaths.instances &&
                primarySegment === "instances") ||
              (item.url === dashboardPaths.transactions &&
                primarySegment === "transactions") ||
              (item.url === dashboardPaths.invoices &&
                primarySegment === "invoices"),
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
