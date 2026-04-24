import { UserDetails } from "@/components/user-details"

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserDetailPage({
  params,
}: UserDetailPageProps) {
  const { id } = await params
  const userId = Number(id)

  if (Number.isNaN(userId)) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-red-600">Invalid user ID</p>
      </div>
    )
  }

  return <UserDetails userId={userId} />
}
