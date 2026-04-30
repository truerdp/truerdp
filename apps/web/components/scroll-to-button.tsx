"use client"

import React from "react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import { ShimmerButton } from "@workspace/ui/components/shimmer-button"
import { cn } from "@workspace/ui/lib/utils"

export default function ScrollToButton({
  targetId,
  children,
  variant,
  size,
  className,
  shimmer = false,
}: {
  targetId: string
  children: React.ReactNode
  variant?: "default" | "outline"
  size?: "sm" | "default" | "lg"
  className?: string
  shimmer?: boolean
}) {
  const handleClick = () => {
    const el = document.getElementById(targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      try {
        history.replaceState(null, "", `#${targetId}`)
      } catch (err) {
        /* ignore */
      }
    }
  }

  if (shimmer) {
    return (
      <ShimmerButton
        type="button"
        onClick={handleClick}
        className={cn("h-8 gap-1.5 px-4 py-0 text-sm font-medium", className)}
        background="linear-gradient(135deg, oklch(0.52 0.16 248), oklch(0.54 0.14 190))"
      >
        <HugeiconsIcon
          icon={CreditCardIcon}
          size={16}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {children}
      </ShimmerButton>
    )
  }

  return (
    <Button
      size={size ?? "sm"}
      variant={variant}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Button>
  )
}
