import { InstanceDetails } from "@/components/instance-details"

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
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Invalid instance ID</p>
      </div>
    )
  }

  return <InstanceDetails instanceId={instanceId} />
}
