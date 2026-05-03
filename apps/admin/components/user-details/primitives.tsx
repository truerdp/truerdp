import Link from "next/link"
import type { ComponentProps } from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import type { InsightTone } from "./types"

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-3xl" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="h-10 w-80 rounded-full" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-4xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-4xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SectionEmpty({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function MetricTile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-background/85 p-4 shadow-sm backdrop-blur">
      <div className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{helper}</div>
    </div>
  )
}

export function InsightRow({
  title,
  description,
  tone = "neutral",
}: {
  title: string
  description: string
  tone?: InsightTone
}) {
  return (
    <div className="flex gap-3 rounded-3xl border border-border/60 bg-muted/30 p-4">
      <span
        className={cn(
          "mt-1 size-2.5 shrink-0 rounded-full",
          tone === "good" && "bg-primary",
          tone === "warning" && "bg-amber-500",
          tone === "neutral" && "bg-muted-foreground/50"
        )}
      />
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="w-full text-sm font-medium break-words sm:w-auto sm:text-right">
        {value}
      </span>
    </div>
  )
}

export function CompactField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </div>
      <div className={cn("text-sm font-medium break-words", className)}>
        {value}
      </div>
    </div>
  )
}

export function ActiveInstanceLink({
  href,
  id,
  label,
}: {
  href: ComponentProps<typeof Link>["href"]
  id: number
  label: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-3xl border border-border/60 bg-muted/25 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Instance #{id}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
        <Badge variant="default">Live</Badge>
      </div>
    </Link>
  )
}
