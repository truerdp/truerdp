"use client"

import { useSearchParams } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { BillingTab } from "./billing-tab"
import { InfrastructureTab } from "./infrastructure-tab"
import { OverviewTab } from "./overview-tab"
import type { UserDetailsData } from "./types"

interface UserDetailsTabsProps {
  data: UserDetailsData
  successRate: string
}

export function UserDetailsTabs({ data, successRate }: UserDetailsTabsProps) {
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const defaultTab =
    requestedTab === "billing" || requestedTab === "infrastructure"
      ? requestedTab
      : "overview"

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList
        variant="line"
        className="w-full justify-start overflow-x-auto pb-1"
      >
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
      </TabsList>
      <OverviewTab data={data} />
      <BillingTab data={data} successRate={successRate} />
      <InfrastructureTab data={data} />
    </Tabs>
  )
}
