import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ServerStack01Icon } from "@hugeicons/core-free-icons"

import ScrollToButton from "@/components/scroll-to-button"
import { Reveal } from "@/components/landing/reveal"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DotPattern } from "@workspace/ui/components/dot-pattern"
import { TextAnimate } from "@workspace/ui/components/text-animate"
import { statCardClass } from "./styles"
import type { HeroContent, PlanPricingOption } from "./types"

interface HeroSectionProps {
  displayClassName: string
  hero: HeroContent
  planCountLabel: string
  uniqueLocations: number
  uniqueTypes: number
  cheapestOption: PlanPricingOption | null
}

export function HeroSection({
  displayClassName,
  hero,
  planCountLabel,
  uniqueLocations,
  uniqueTypes,
  cheapestOption,
}: HeroSectionProps) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 pt-10 md:pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <Reveal className="flex flex-col gap-6">
        <Badge
          variant="secondary"
          className="w-fit gap-2 rounded-full border border-[oklch(0.78_0.08_205)] bg-[oklch(0.97_0.035_205)] px-4 py-1.5 text-[oklch(0.31_0.09_212)] shadow-sm dark:border-white/10 dark:bg-white/8 dark:text-white/80"
        >
          <HugeiconsIcon icon={ServerStack01Icon} size={14} strokeWidth={2} />
          {hero.badge}
        </Badge>
        <TextAnimate
          as="h1"
          animation="blurInUp"
          by="word"
          once
          className={`${displayClassName} max-w-3xl text-4xl leading-[1.04] tracking-tight text-[oklch(0.2_0.045_265)] md:text-5xl lg:text-6xl dark:text-white`}
        >
          {hero.headline}
        </TextAnimate>
        <p className="max-w-2xl text-base leading-7 text-[oklch(0.35_0.04_250)] md:text-lg dark:text-white/76">
          {hero.description}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {cheapestOption ? (
            <ScrollToButton targetId="plans" shimmer>
              {hero.primaryCtaLabel}
            </ScrollToButton>
          ) : (
            <Link href={webPaths.signup}>
              <Button size="sm">{hero.primaryCtaLabel}</Button>
            </Link>
          )}
          <ScrollToButton targetId="how-it-works" size="sm" variant="outline">
            {hero.secondaryCtaLabel}
          </ScrollToButton>
        </div>
        <div className="grid max-w-2xl gap-2 text-sm text-[oklch(0.42_0.055_250)] sm:grid-cols-3 dark:text-white/68">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 dark:border-white/10 dark:bg-white/7">
            <span className="size-1.5 rounded-full bg-[oklch(0.7_0.13_166)]" />
            Fast checkout
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 dark:border-white/10 dark:bg-white/7">
            <span className="size-1.5 rounded-full bg-[oklch(0.68_0.13_205)]" />
            Clear resources
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3 py-1.5 dark:border-white/10 dark:bg-white/7">
            <span className="size-1.5 rounded-full bg-[oklch(0.72_0.13_78)]" />
            Region choice
          </span>
        </div>
        <p className="max-w-xl text-sm text-[oklch(0.45_0.055_250)] dark:text-white/65">
          {hero.trustLine}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-[oklch(0.48_0.06_250)] dark:text-white/60">
              Catalog
            </p>
            <p className="mt-1 text-lg font-semibold text-[oklch(0.28_0.11_265)] dark:text-white">
              {planCountLabel}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-[oklch(0.48_0.06_250)] dark:text-white/60">
              Locations
            </p>
            <p className="mt-1 text-lg font-semibold text-[oklch(0.28_0.11_265)] dark:text-white">
              {uniqueLocations || 0}
            </p>
          </div>
          <div className={statCardClass}>
            <p className="text-[oklch(0.48_0.06_250)] dark:text-white/60">
              Plan Types
            </p>
            <p className="mt-1 text-lg font-semibold text-[oklch(0.28_0.11_265)] dark:text-white">
              {uniqueTypes || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-[oklch(0.82_0.11_165)]/70 bg-[oklch(0.96_0.045_165)]/85 px-3 py-3 shadow-sm backdrop-blur dark:border-[oklch(0.7_0.12_170)]/30 dark:bg-[oklch(0.3_0.08_170)]/35">
            <p className="text-[oklch(0.42_0.09_166)] dark:text-white/65">
              Starts At
            </p>
            <p className="mt-1 text-lg font-semibold text-[oklch(0.28_0.12_166)] dark:text-white">
              {cheapestOption ? formatAmount(cheapestOption.priceUsdCents) : "-"}
            </p>
          </div>
        </div>
      </Reveal>
      <Reveal delayMs={150} className="relative hidden lg:block">
        <article className="relative min-h-[520px] overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-5 text-white shadow-2xl shadow-[oklch(0.45_0.1_220)]/20 md:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.75_0.13_205),oklch(0.72_0.13_166),oklch(0.78_0.13_78))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgb(255_255_255/0.1),transparent_34%,rgb(255_255_255/0.08)_72%,transparent)]" />
          <DotPattern
            width={22}
            height={22}
            cr={1.1}
            className="text-white/12"
          />
          <div className="relative flex items-center justify-between gap-4 border-b border-white/15 pb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
                <HugeiconsIcon
                  icon={ServerStack01Icon}
                  size={18}
                  strokeWidth={2}
                />
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-white/55">Windows RDP hosting</p>
                <p className="font-medium">Production-ready servers</p>
              </div>
            </div>
            <Badge className="rounded-full border-white/20 bg-[oklch(0.77_0.15_166)] text-[oklch(0.17_0.05_166)]">
              Available
            </Badge>
          </div>

          <div className="relative mt-5 min-h-[285px] overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] p-4">
            <div className="pointer-events-none absolute inset-x-4 top-5 z-10 flex items-center justify-between rounded-2xl border border-white/18 bg-white/14 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-lg">
              <div>
                <p className="text-xs text-white/50">Global availability</p>
                <p className="text-sm font-semibold">Low-latency RDP regions</p>
              </div>
              <Badge className="rounded-full border-white/20 bg-white/12 text-white">
                {uniqueLocations || 0} regions
              </Badge>
            </div>

            <div className="absolute inset-x-4 bottom-4 z-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/18 bg-white/14 p-3 shadow-lg shadow-black/10 backdrop-blur-lg">
                <p className="text-xs text-white/50">Plans</p>
                <p className="mt-1 text-sm font-semibold">{planCountLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/18 bg-white/14 p-3 shadow-lg shadow-black/10 backdrop-blur-lg">
                <p className="text-xs text-white/50">Regions</p>
                <p className="mt-1 text-sm font-semibold">
                  {uniqueLocations || 0} locations
                </p>
              </div>
              <div className="rounded-2xl border border-white/18 bg-white/14 p-3 shadow-lg shadow-black/10 backdrop-blur-lg">
                <p className="text-xs text-white/50">Types</p>
                <p className="mt-1 text-sm font-semibold">
                  {uniqueTypes || 0} workloads
                </p>
              </div>
            </div>
          </div>
          <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs tracking-[0.16em] text-white/55 uppercase">
                Server access
              </p>
              <p className="mt-1 text-lg font-semibold">Windows RDP</p>
              <p className="mt-1 text-sm text-white/65">
                Dedicated resources with clear specs before checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
              <p className="text-xs tracking-[0.16em] text-white/55 uppercase">
                Provisioning
              </p>
              <p className="mt-1 text-lg font-semibold">Guided setup</p>
              <p className="mt-1 text-sm text-white/65">
                Support follows through after order confirmation.
              </p>
            </div>
          </div>
        </article>
      </Reveal>
    </section>
  )
}
