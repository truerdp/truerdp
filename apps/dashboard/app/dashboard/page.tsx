"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import InstanceTable from "@/components/instance-table"

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["instances"],
    queryFn: () => api("/instances"),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My Instances</h1>
      <InstanceTable instances={data || []} />
    </div>
  )
}
