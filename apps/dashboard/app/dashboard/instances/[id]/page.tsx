"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import CredentialsDialog from "@/components/credentials-dialog"

export default function InstanceDetails() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ["instance", id],
    queryFn: () => api(`/instances/${id}`),
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Instance #{data.id}</h1>

      <div className="space-y-2">
        <p>Status: {data.status}</p>
        <p>IP: {data.ipAddress}</p>
        <p>Username: {data.username}</p>
      </div>

      <div className="mt-4">
        <CredentialsDialog instanceId={data.id} />
      </div>
    </div>
  )
}
