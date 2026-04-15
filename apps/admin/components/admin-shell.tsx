"use client"

import Link from "next/link"
import { useSelectedLayoutSegments } from "next/navigation"
import type { ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { adminPaths } from "@/lib/paths"
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
      parentHref: adminPaths.overview,
    }
  }

  if (segments[0] === "instances" && segments.length === 1) {
    return {
      currentLabel: "Instances",
      parentLabel: null,
      parentHref: adminPaths.overview,
    }
  }

  if (segments[0] === "instances" && segments[1] === "expired") {
    return {
      currentLabel: "Expired Instances",
      parentLabel: "Instances",
      parentHref: adminPaths.instances,
    }
  }

  if (segments[0] === "transactions") {
    return {
      currentLabel: "Transactions",
      parentLabel: null,
      parentHref: adminPaths.overview,
    }
  }

  return {
    currentLabel: "Admin",
    parentLabel: null,
    parentHref: adminPaths.overview,
  }
}

export default function AdminShell({ children }: { children: ReactNode }) {
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
                <BreadcrumbLink render={<Link href={adminPaths.overview} />}>
                  Admin
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
