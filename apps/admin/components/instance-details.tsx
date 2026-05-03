"use client"

import { AlertCircle } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { useInstanceDetails } from "@/hooks/use-instance-details"
import { InstanceCard } from "@/components/instance-details/instance-card"
import { ResourceCard } from "@/components/instance-details/resource-card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Spinner } from "@workspace/ui/components/spinner"

interface InstanceDetailsProps {
  instanceId: number
}

export function InstanceDetails({ instanceId }: InstanceDetailsProps) {
  const { data, isLoading, error } = useInstanceDetails(instanceId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <HugeiconsIcon icon={AlertCircle} className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load instance details. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <InstanceCard data={data} />
      <ResourceCard data={data} />
    </div>
  )
}
