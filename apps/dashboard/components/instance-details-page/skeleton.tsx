import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { Skeleton } from "@workspace/ui/components/skeleton"

function SkeletonRow({ labelWidth }: { labelWidth: string }) {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className={labelWidth} />
        <Skeleton className="h-4 w-28" />
      </div>
      <Separator />
    </>
  )
}

export function InstanceDetailsSkeleton() {
  return (
    <section className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Separator />
          <SkeletonRow labelWidth="h-4 w-20" />
          <SkeletonRow labelWidth="h-4 w-16" />
          <SkeletonRow labelWidth="h-4 w-20" />
          <SkeletonRow labelWidth="h-4 w-20" />
        </CardContent>
      </Card>
    </section>
  )
}
