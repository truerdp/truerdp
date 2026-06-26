"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Moon02Icon, Sun02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "@/components/theme-provider"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Kbd } from "@workspace/ui/components/kbd"

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <HugeiconsIcon
              icon={isDark ? Sun02Icon : Moon02Icon}
              size={18}
              strokeWidth={2}
            />
            <span className="sr-only">
              {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </span>
          </Button>
        }
      />
      <TooltipContent>
        <p>
          {isDark ? "Switch to light mode" : "Switch to dark mode"}{" "}
          <Kbd>Alt+Shift+D</Kbd>
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export default ThemeToggle
