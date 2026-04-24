"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { adminPaths } from "@/lib/paths"
import { cn } from "@workspace/ui/lib/utils"

interface AdminUserLinkProps {
  userId: number
  primary?: ReactNode
  secondary?: ReactNode
  className?: string
}

export function AdminUserLink({
  userId,
  primary,
  secondary,
  className,
}: AdminUserLinkProps) {
  return (
    <Link
      href={adminPaths.userDetails(userId)}
      className={cn(
        "group inline-flex flex-col gap-0.5 rounded-md transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className
      )}
    >
      <span className="text-sm font-medium">
        {primary ?? `User #${userId}`}
      </span>
      {secondary ? (
        <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary/80">
          {secondary}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary/80">
          Open User 360
        </span>
      )}
    </Link>
  )
}
