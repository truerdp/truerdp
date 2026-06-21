import * as React from "react"
import { cn } from "@workspace/ui/lib/utils"
import logoSvg from "@workspace/brand-assets/logo.svg"

function SiteLogo({
  imgOnly = false,
  className,
  brandName = "TrueRDP",
  height = 80,
  width = 80,
  ...props
}: {
  imgOnly?: boolean
  brandName?: string
  className?: string
  height?: number
  width?: number
} & React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <img
        loading="eager"
        src={logoSvg.src}
        alt={brandName}
        width={width}
        height={height}
        className={cn("dark:grayscale dark:invert")}
      />
      {!imgOnly && (
        <span
          aria-label={brandName}
          className="font-brand text-2xl text-blue-900 dark:text-white"
        >
          <span className="text-black dark:text-white">True</span>
          <span className="dark:text-white">RDP</span>
        </span>
      )}
    </div>
  )
}

export { SiteLogo }
