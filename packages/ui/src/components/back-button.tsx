import type { ComponentProps } from "react"
import { ChevronLeft } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@workspace/ui/lib/utils"

import { Button } from "./button"

type BackButtonProps = ComponentProps<typeof Button>

function BackButton({
  children,
  className,
  nativeButton,
  render,
  size = "sm",
  variant = "ghost",
  ...props
}: BackButtonProps) {
  return (
    <Button
      className={cn("justify-start", className)}
      nativeButton={nativeButton ?? (render ? false : undefined)}
      render={render}
      size={size}
      variant={variant}
      {...props}
    >
      <HugeiconsIcon
        icon={ChevronLeft}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {children}
    </Button>
  )
}

export { BackButton }
