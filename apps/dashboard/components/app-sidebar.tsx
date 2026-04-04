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
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LayoutBottomIcon,
  DashboardSquare01Icon,
  ComputerTerminalIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"

const team = {
  name: "TrueRDP",
  logo: <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} />,
  plan: "Dashboard",
}

const navMain = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />,
  },
  {
    title: "Instances",
    url: "/dashboard/instances",
    icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
  },
  {
    title: "Transactions",
    url: "/dashboard/transactions",
    icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
  },
]

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [team],
  navMain,
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

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
              pathname === item.url ||
              (item.url === "/dashboard/instances" &&
                pathname.startsWith("/dashboard/instances/")),
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
