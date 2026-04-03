"use client"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { HugeiconsIcon } from "@hugeicons/react"
import { ServerStack01Icon } from "@hugeicons/core-free-icons"

interface InstancesEmptyStateProps {
  className?: string
  description?: string
}

export default function InstancesEmptyState({
  className,
  description = "Buy a plan to get started",
}: InstancesEmptyStateProps) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={ServerStack01Icon} />
        </EmptyMedia>
        <EmptyTitle>No instances found</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
