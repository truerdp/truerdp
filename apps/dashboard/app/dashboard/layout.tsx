"use client"

import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
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
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

function getBreadcrumbLabel(pathname: string) {
  if (pathname === "/dashboard") {
    return "Overview"
  }

  if (pathname === "/dashboard/instances") {
    return "Instances"
  }

  if (pathname === "/dashboard/transactions") {
    return "Transactions"
  }

  if (pathname.startsWith("/dashboard/instances/")) {
    const instanceId = pathname.split("/").pop()
    return instanceId ? `Instance #${instanceId}` : "Instance Details"
  }

  return "Dashboard"
}

function getParentLabel(pathname: string) {
  if (pathname.startsWith("/dashboard/instances/")) {
    return "Instances"
  }

  return null
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentLabel = getBreadcrumbLabel(pathname)
  const parentLabel = getParentLabel(pathname)
  const parentHref = pathname.startsWith("/dashboard/instances/")
    ? "/dashboard/instances"
    : "/dashboard"

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
                <BreadcrumbLink render={<Link href="/dashboard" />}>
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
