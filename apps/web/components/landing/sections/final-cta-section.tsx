import Link from "next/link"

import { PlanCheckoutButton } from "@/components/home-checkout-actions"
import { Reveal } from "@/components/landing/reveal"
import { webPaths } from "@/lib/paths"
import { Button } from "@workspace/ui/components/button"
import { sectionEyebrowClass } from "./styles"
import type { FinalCta, PlanPricingOption } from "./types"

interface FinalCtaSectionProps {
  displayClassName: string
  content: FinalCta
  cheapestOption: PlanPricingOption | null
}

export function FinalCtaSection({
  displayClassName,
  content,
  cheapestOption,
}: FinalCtaSectionProps) {
  return (
    <section className="mx-auto mt-12 w-full max-w-6xl px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(135deg,oklch(0.96_0.042_205),oklch(0.95_0.035_78)_58%,oklch(0.96_0.032_166))] p-6 shadow-xl shadow-[oklch(0.55_0.1_220)]/12 md:p-8 dark:border-white/12 dark:bg-[linear-gradient(140deg,oklch(0.24_0.055_218),oklch(0.18_0.035_250))] dark:shadow-black/40">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <p className={sectionEyebrowClass}>Launch when ready</p>
              <h2
                className={`${displayClassName} text-2xl tracking-tight text-foreground md:text-3xl dark:text-white`}
              >
                {content.headline}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-foreground/75 md:text-base dark:text-white/75">
                {content.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {cheapestOption ? (
                <PlanCheckoutButton planPricingId={cheapestOption.id} />
              ) : (
                <Link href={webPaths.signup}>
                  <Button size="sm">{content.primaryCtaLabel}</Button>
                </Link>
              )}
              <Link href={webPaths.contact}>
                <Button size="sm" variant="outline">
                  {content.secondaryCtaLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
