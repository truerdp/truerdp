import { PlanDetails } from "@/components/plan-details"

interface PlanDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PlanDetailsPage({
  params,
}: PlanDetailsPageProps) {
  const { id } = await params
  const planId = parseInt(id, 10)

  if (Number.isNaN(planId)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Invalid plan ID</div>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Details</h1>
        <p className="text-sm text-muted-foreground">
          View and manage plan resources and pricing.
        </p>
      </div>

      <PlanDetails planId={planId} />
    </section>
  )
}
