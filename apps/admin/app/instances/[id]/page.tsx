import Link from "next/link"

import { InstanceDetails } from "@/components/instance-details"
import { adminPaths } from "@/lib/paths"
import { BackButton } from "@workspace/ui/components/back-button"
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
      <BackButton
        render={<Link href={adminPaths.instances} />}
        className="self-start"
      >
        Back to instances
      </BackButton>
      <InstanceDetails instanceId={instanceId} />
    </section>
  )
}
