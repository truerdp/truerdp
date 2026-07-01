import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"

import { InstanceDetails } from "@/components/instance-details"
import { adminPaths } from "@/lib/paths"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

interface InstanceDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function InstanceDetailPage({
  params,
}: InstanceDetailPageProps) {
  const { id } = await params
  const instanceId = Number(id)

  if (Number.isNaN(instanceId)) {
    return (
      <Empty className="w-full border">
        <EmptyHeader>
          <EmptyTitle>Missing instance reference</EmptyTitle>
          <EmptyDescription>
            Open an instance from the instances list.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <section className="flex w-full flex-col gap-4">
      <Link
        href={adminPaths.instances}
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "self-start",
        })}
      >
        <HugeiconsIcon
          icon={ArrowLeft02Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Back to instances
      </Link>
      <InstanceDetails instanceId={instanceId} />
    </section>
  )
}
