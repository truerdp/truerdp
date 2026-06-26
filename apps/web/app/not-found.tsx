"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home03Icon,
  ArrowLeft02Icon,
  HelpCircleIcon,
  CreditCardIcon,
} from "@hugeicons/core-free-icons"

import { DotPattern } from "@workspace/ui/components/dot-pattern"
import { InteractiveHoverButton } from "@workspace/ui/components/interactive-hover-button"
import { Button } from "@workspace/ui/components/button"
import { webPaths } from "@/lib/paths"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_46%,oklch(0.985_0.018_166)_100%)] px-4 py-24 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      {/* Dynamic Background Mesh Orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px] dark:bg-primary/25" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent/10 blur-[120px] dark:bg-accent/25" />
      </div>

      {/* Network Matrix Grid Pattern */}
      <DotPattern
        width={24}
        height={24}
        glow={true}
        className="[mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)] opacity-40"
      />

      {/* Double-Bezel Card Outer Shell */}
      <div className="relative z-10 w-full max-w-2xl transform-gpu rounded-[2rem] border border-black/10 bg-black/5 p-2 shadow-2xl backdrop-blur-md transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-white/10 dark:bg-white/5">
        {/* Double-Bezel Card Inner Core */}
        <div className="flex flex-col items-center rounded-[calc(2rem-0.5rem)] border border-black/5 bg-card/60 px-6 py-12 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] md:px-12 dark:border-white/5 dark:bg-black/40">
          {/* Micro Status Tag */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-destructive uppercase dark:bg-destructive/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-destructive"></span>
            </span>
            Status: 404 Unreachable
          </div>

          {/* Big Typography 404 */}
          <h1 className="font-brand text-8xl font-black tracking-widest text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)] select-none md:text-9xl">
            404
          </h1>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Node Address Resolution Failed
          </h2>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            The target endpoint you are trying to connect to is offline, has
            been decommissioned, or does not exist on our servers. Please check
            the URL syntax and try again.
          </p>

          {/* Core Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Primary Action Button */}
            <Link href={webPaths.home} id="btn-404-home">
              <InteractiveHoverButton className="w-full sm:w-auto">
                Return to Console
              </InteractiveHoverButton>
            </Link>

            {/* Secondary Action Button */}
            <Button
              variant="outline"
              id="btn-404-back"
              onClick={() => router.back()}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border-border bg-input/30 hover:bg-input/50 sm:w-auto"
            >
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Go Back
            </Button>
          </div>

          {/* Quick Diagnostics / Navigation Links */}
          <div className="mt-12 w-full border-t border-border/60 pt-8 dark:border-white/10">
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Quick Diagnostic Directory
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link
                href={webPaths.plans}
                id="link-404-plans"
                className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/75 hover:text-foreground dark:border-white/5"
              >
                <HugeiconsIcon
                  icon={CreditCardIcon}
                  size={14}
                  strokeWidth={2}
                />
                View Plans
              </Link>
              <Link
                href={webPaths.faq}
                id="link-404-faq"
                className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/75 hover:text-foreground dark:border-white/5"
              >
                <HugeiconsIcon
                  icon={HelpCircleIcon}
                  size={14}
                  strokeWidth={2}
                />
                Read FAQs
              </Link>
              <Link
                href={webPaths.contact}
                id="link-404-contact"
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground transition-all hover:border-primary/30 hover:bg-muted/75 hover:text-foreground sm:col-span-1 dark:border-white/5"
              >
                <HugeiconsIcon icon={Home03Icon} size={14} strokeWidth={2} />
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
