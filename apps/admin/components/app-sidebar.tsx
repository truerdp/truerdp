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
} from "@hugeicons/core-free-icons"
import { adminPaths } from "@/lib/paths"

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
    title: "Expired Instances",
    url: adminPaths.expiredInstances,
    icon: <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} />,
  },
]

const data = {
  user: {
    name: "Admin",
    email: "admin@truerdp.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [team],
  navMain,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const segments = useSelectedLayoutSegments()

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
              (item.url === adminPaths.overview && segments.length === 0) ||
              (item.url === adminPaths.instances &&
                segments[0] === "instances" &&
                segments.length === 1) ||
              (item.url === adminPaths.expiredInstances &&
                segments[0] === "instances" &&
                segments[1] === "expired"),
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
