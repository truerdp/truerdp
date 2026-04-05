"use client"

import Link from "next/link"
import { useSelectedLayoutSegments } from "next/navigation"
import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { dashboardPaths } from "@/lib/paths"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

function getBreadcrumbState(segments: string[]) {
  if (segments.length === 0) {
    return {
      currentLabel: "Overview",
      parentLabel: null,
      parentHref: dashboardPaths.overview,
    }
  }

  if (segments[0] === "instances") {
    if (segments.length > 1) {
      return {
        currentLabel: `Instance #${segments[1]}`,
        parentLabel: "Instances",
        parentHref: dashboardPaths.instances,
      }
    }

    return {
      currentLabel: "Instances",
      parentLabel: null,
      parentHref: dashboardPaths.overview,
    }
  }

  if (segments[0] === "transactions") {
    return {
      currentLabel: "Transactions",
      parentLabel: null,
      parentHref: dashboardPaths.overview,
    }
  }

  return {
    currentLabel: "Dashboard",
    parentLabel: null,
    parentHref: dashboardPaths.overview,
  }
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const segments = useSelectedLayoutSegments()
  const { currentLabel, parentLabel, parentHref } = getBreadcrumbState(segments)

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink
                  render={<Link href={dashboardPaths.overview} />}
                >
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              {parentLabel && (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink render={<Link href={parentHref} />}>
                      {parentLabel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
