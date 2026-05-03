import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Alert02Icon, ComputerTerminalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

export function DashboardEmptyState({ title }: { title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Everything looks clear right now.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
      <span>{message}</span>
    </div>
  )
}

