import Link from "next/link"
import ScrollToButton from "../scroll-to-button"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkBadgeIcon,
  CreditCardIcon,
  Home03Icon,
  Invoice03Icon,
  ServerStack01Icon,
} from "@hugeicons/core-free-icons"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { DotPattern } from "@workspace/ui/components/dot-pattern"
import { Globe } from "@workspace/ui/components/globe"
import { TextAnimate } from "@workspace/ui/components/text-animate"

import { PlanCheckoutButton } from "@/components/home-checkout-actions"
import { formatAmount } from "@/lib/format"
import { webPaths } from "@/lib/paths"
import { Reveal } from "@/components/landing/reveal"

export interface PlanPricingOption {
  id: number
  durationDays: number
  priceUsdCents: number
}

export interface Plan {
  id: number
  name: string
  cpu: number
  ram: number
  storage: number
  planType: string
  planLocation: string
  isFeatured: boolean
  pricingOptions: PlanPricingOption[]
}

interface HeroContent {
  badge: string
  headline: string
  description: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  trustLine: string
}

interface ValueProp {
  title: string
  description: string
}

interface JourneyStep {
  title: string
  description: string
  details: string[]
}

interface JourneySectionContent extends SectionIntro {
  steps: JourneyStep[]
}

interface SectionIntro {
  eyebrow: string
  headline: string
  description?: string
  ctaLabel?: string
}

interface SectionLabels {
  featuredPlansTitle: string
  featuredPlansDescription: string
  planGroupsTitle: string
  planLocationsTitle: string
  comparisonTitle: string
  comparisonDescription: string
}

interface FinalCta {
  headline: string
  description: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
}

interface Testimonial {
  quote: string
  name: string
  role: string
}

interface FaqItem {
  question: string
  answer: string
}

interface TestimonialsContent extends SectionIntro {
  ratingLabel: string
  items: Testimonial[]
}

interface FaqPreviewContent extends SectionIntro {
  items: FaqItem[]
}

interface LiveSupportTopic {
  title: string
  description: string
}

interface LiveSupportContent extends SectionIntro {
  topics: LiveSupportTopic[]
}

interface LocationSectionContent extends SectionIntro {
  footerTitle: string
  footerDescription: string
  ctaLabel: string
}

interface FooterColumnLink {
  label: string
  href: string
}

interface FooterColumn {
  title: string
  links: FooterColumnLink[]
}

interface FooterContent {
  tagline: string
  copyrightText: string
  columns: FooterColumn[]
}

const valuePropStyles = [
  {
    icon: "bg-[oklch(0.93_0.08_205)] text-[oklch(0.34_0.11_212)]",
    card: "border-[oklch(0.8_0.08_205)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_205),oklch(0.95_0.04_205))] dark:bg-[linear-gradient(150deg,oklch(0.24_0.055_218),oklch(0.17_0.035_250))]",
  },
  {
    icon: "bg-[oklch(0.94_0.065_78)] text-[oklch(0.43_0.12_66)]",
    card: "border-[oklch(0.84_0.075_78)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_84),oklch(0.96_0.035_78))] dark:bg-[linear-gradient(150deg,oklch(0.24_0.052_70),oklch(0.17_0.035_250))]",
  },
  {
    icon: "bg-[oklch(0.93_0.075_166)] text-[oklch(0.32_0.105_166)]",
    card: "border-[oklch(0.8_0.08_166)]/70 bg-[linear-gradient(150deg,oklch(0.995_0.012_166),oklch(0.95_0.04_166))] dark:bg-[linear-gradient(150deg,oklch(0.22_0.055_166),oklch(0.17_0.035_250))]",
  },
]

const planCardStyles = [
  "border-[oklch(0.82_0.075_205)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.96_0.032_205))] dark:bg-[linear-gradient(160deg,oklch(0.23_0.052_218),oklch(0.17_0.035_250))]",
  "border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.965_0.03_78))] dark:bg-[linear-gradient(160deg,oklch(0.23_0.048_72),oklch(0.17_0.035_250))]",
  "border-[oklch(0.82_0.075_166)]/70 bg-[linear-gradient(160deg,oklch(1_0_0),oklch(0.96_0.032_166))] dark:bg-[linear-gradient(160deg,oklch(0.21_0.052_166),oklch(0.17_0.035_250))]",
]

const statCardClass =
  "rounded-2xl border border-white/80 bg-white/75 px-3 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/8"

const sectionEyebrowClass =
  "text-xs font-semibold tracking-[0.18em] text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]"

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
              {cheapestOption
                ? formatAmount(cheapestOption.priceUsdCents)
                : "-"}
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

            <Globe
              className="top-12 opacity-90"
              config={{
                dark: 1,
                baseColor: [0.34, 0.58, 0.74],
                glowColor: [0.34, 0.9, 0.8],
                markerColor: [0.95, 0.78, 0.32],
                mapBrightness: 5,
                markers: [
                  { location: [37.0902, -95.7129], size: 0.06 },
                  { location: [51.1657, 10.4515], size: 0.06 },
                  { location: [1.3521, 103.8198], size: 0.06 },
                  { location: [20.5937, 78.9629], size: 0.06 },
                  { location: [55.3781, -3.436], size: 0.06 },
                ],
              }}
            />

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

interface JourneySectionProps {
  displayClassName: string
  content: JourneySectionContent
}

export function JourneySection({
  displayClassName,
  content,
}: JourneySectionProps) {
  return (
    <section
      id="how-it-works"
      className="mx-auto mt-32 mb-24 w-full max-w-6xl scroll-mt-20 px-6"
    >
      <Reveal className="mb-20">
        <p className={sectionEyebrowClass}>{content.eyebrow}</p>
        <div className="grid gap-12 md:grid-cols-12 md:items-end">
          <h2
            className={`${displayClassName} col-span-12 text-4xl leading-[1.1] tracking-tighter text-foreground md:col-span-7 md:text-6xl`}
          >
            {content.headline}
          </h2>
          {content.description ? (
            <p className="col-span-12 text-lg leading-relaxed text-muted-foreground md:col-span-5 md:pb-2">
              {content.description}
            </p>
          ) : null}
        </div>
      </Reveal>

      <div className="flex flex-col divide-y divide-foreground/10 border-y border-foreground/10 md:flex-row md:divide-x md:divide-y-0">
        {content.steps.map((step, index) => (
          <Reveal
            key={step.title}
            delayMs={index * 150}
            className="group flex-1"
          >
            <article className="relative flex h-full flex-col overflow-hidden p-8 py-12 transition-colors duration-500 hover:bg-foreground/[0.02] md:p-12 dark:hover:bg-white/[0.02]">
              <span className="absolute -top-8 -right-8 text-[16rem] leading-none font-light tracking-tighter text-foreground/[0.03] transition-all duration-700 select-none group-hover:-translate-y-4 group-hover:text-foreground/[0.06] dark:text-white/[0.02] dark:group-hover:text-white/[0.05]">
                {index + 1}
              </span>

              <div className="relative mt-12 md:mt-32">
                <p className="mb-4 font-mono text-xs font-semibold tracking-widest text-muted-foreground">
                  STEP 0{index + 1}
                </p>
                <h3 className="mb-4 text-2xl font-medium tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                {step.details.length > 0 ? (
                  <div className="mt-8">
                    <p className="mb-4 font-mono text-[0.68rem] font-semibold tracking-widest text-[oklch(0.42_0.095_205)] uppercase dark:text-[oklch(0.78_0.1_205)]">
                      What happens
                    </p>
                    <ul className="grid gap-3">
                      {step.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex gap-3 text-sm leading-6 text-foreground/75 dark:text-white/70"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[oklch(0.68_0.13_205)] shadow-[0_0_14px_oklch(0.68_0.13_205/0.45)]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

interface ValuePropsSectionProps {
  section: SectionIntro
  valueProps: ValueProp[]
}

export function ValuePropsSection({
  section,
  valueProps,
}: ValuePropsSectionProps) {
  const icons = [ServerStack01Icon, CreditCardIcon, Invoice03Icon]

  return (
    <section className="mx-auto mt-14 w-full max-w-6xl px-6">
      <Reveal className="mb-5 flex max-w-3xl flex-col gap-2">
        <p className={sectionEyebrowClass}>{section.eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {section.headline}
        </h2>
      </Reveal>
      <div className="grid gap-4 md:grid-cols-3">
        {valueProps.map((item, index) => (
          <Reveal key={item.title} delayMs={index * 80}>
            <article
              className={`group h-full rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                valuePropStyles[index % valuePropStyles.length]?.card ?? ""
              } dark:border-white/10`}
            >
              <span
                className={`inline-flex size-10 items-center justify-center rounded-2xl ${
                  valuePropStyles[index % valuePropStyles.length]?.icon ?? ""
                } dark:bg-white/10 dark:text-white`}
              >
                <HugeiconsIcon
                  icon={icons[index % icons.length] || ServerStack01Icon}
                  size={20}
                  strokeWidth={2}
                />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/70 dark:text-white/65">
                {item.description}
              </p>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-[linear-gradient(90deg,oklch(0.66_0.13_205),oklch(0.72_0.12_166))] transition-all group-hover:w-full" />
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function getLowestPricingOption(plan: Plan): PlanPricingOption | null {
  if (plan.pricingOptions.length === 0) {
    return null
  }

  return (
    [...plan.pricingOptions].sort(
      (a, b) => a.priceUsdCents - b.priceUsdCents
    )[0] ?? null
  )
}

interface FeaturedPlansSectionProps {
  displayClassName: string
  plans: Plan[]
  title: string
  description: string
}

export function FeaturedPlansSection({
  displayClassName,
  plans,
  title,
  description,
}: FeaturedPlansSectionProps) {
  return (
    <section
      id="plans"
      className="mx-auto mt-16 w-full max-w-6xl scroll-mt-20 px-6"
    >
      <Reveal className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={sectionEyebrowClass}>Featured inventory</p>
          <h2
            className={`${displayClassName} text-2xl tracking-tight md:text-3xl`}
          >
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          Admin featured
        </Badge>
      </Reveal>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <Reveal key={plan.id} delayMs={index * 70}>
            <article
              className={`group relative h-full overflow-hidden rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                planCardStyles[index % planCardStyles.length] ?? ""
              } dark:border-white/10`}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.planType} · {plan.planLocation}
                  </p>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {getLowestPricingOption(plan)
                    ? formatAmount(
                        getLowestPricingOption(plan)?.priceUsdCents || 0
                      )
                    : "N/A"}
                </Badge>
              </div>

              <p className="mt-4 text-sm text-foreground/85">
                {plan.cpu} vCPU · {plan.ram} GB RAM · {plan.storage} GB SSD
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/70 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/7">
                  <p className="text-xs text-muted-foreground">CPU</p>
                  <p className="mt-1 text-sm font-semibold">{plan.cpu}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/7">
                  <p className="text-xs text-muted-foreground">RAM</p>
                  <p className="mt-1 text-sm font-semibold">{plan.ram} GB</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white/55 p-2.5 dark:border-white/10 dark:bg-white/7">
                  <p className="text-xs text-muted-foreground">SSD</p>
                  <p className="mt-1 text-sm font-semibold">
                    {plan.storage} GB
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {plan.pricingOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 shadow-xs dark:border-white/10 dark:bg-white/7"
                  >
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">
                        {option.durationDays} days
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatAmount(option.priceUsdCents)}
                      </p>
                    </div>
                    <PlanCheckoutButton planPricingId={option.id} />
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

interface CatalogInsightsSectionProps {
  plansByLocation: Record<string, Plan[]>
  content: LocationSectionContent
}

export function CatalogInsightsSection({
  plansByLocation,
  content,
}: CatalogInsightsSectionProps) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className={sectionEyebrowClass}>{content.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            {content.headline}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {content.description}
          </p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full">
          {Object.keys(plansByLocation).length} regions
        </Badge>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Object.entries(plansByLocation).map(
          ([location, groupedPlans], index) => {
            const lowestOption = groupedPlans
              .map((plan) => getLowestPricingOption(plan))
              .filter((option): option is PlanPricingOption => Boolean(option))
              .sort((a, b) => a.priceUsdCents - b.priceUsdCents)[0]

            return (
              <Reveal key={location} delayMs={index * 55}>
                <Link
                  href={webPaths.planCategory(location)}
                  className="group block h-full rounded-2xl border border-[oklch(0.82_0.075_205)]/70 bg-white/75 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-white/7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-9 items-center justify-center rounded-2xl border border-[oklch(0.78_0.08_205)]/60 bg-[oklch(0.96_0.035_205)] text-[oklch(0.34_0.11_212)] dark:border-white/10 dark:bg-white/10 dark:text-white">
                      <HugeiconsIcon
                        icon={ServerStack01Icon}
                        size={18}
                        strokeWidth={2}
                      />
                    </span>
                    <Badge variant="outline" className="rounded-full">
                      {groupedPlans.length}
                    </Badge>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">{location}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {groupedPlans.length} active plan
                    {groupedPlans.length === 1 ? "" : "s"}
                  </p>

                  <div className="mt-4 rounded-xl border border-white/70 bg-white/55 p-3 dark:border-white/10 dark:bg-white/7">
                    <p className="text-xs text-muted-foreground">Starts at</p>
                    <p className="mt-1 text-lg font-semibold">
                      {lowestOption
                        ? formatAmount(lowestOption.priceUsdCents)
                        : "-"}
                    </p>
                  </div>

                  <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                    {groupedPlans.slice(0, 2).map((plan) => (
                      <Badge
                        key={plan.id}
                        variant="outline"
                        className="max-w-full truncate"
                      >
                        {plan.planType}
                      </Badge>
                    ))}
                  </div>

                  <span className="mt-4 inline-flex text-sm font-medium text-[oklch(0.38_0.11_205)] transition-transform group-hover:translate-x-1 dark:text-[oklch(0.8_0.1_205)]">
                    View location
                  </span>
                </Link>
              </Reveal>
            )
          }
        )}
      </div>

      <Reveal className="mt-4">
        <div className="rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-[linear-gradient(135deg,oklch(0.98_0.02_84),oklch(0.96_0.035_205))] p-4 shadow-sm dark:border-white/10 dark:bg-[linear-gradient(135deg,oklch(0.21_0.045_250),oklch(0.18_0.035_230))]">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold">{content.footerTitle}</p>
              <p className="text-sm text-muted-foreground">
                {content.footerDescription}
              </p>
            </div>
            <Link href={webPaths.plans}>
              <Button size="sm" variant="outline">
                {content.ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

interface ComparisonSectionProps {
  plans: Plan[]
  title: string
  description: string
}

export function ComparisonSection({
  plans,
  title,
  description,
}: ComparisonSectionProps) {
  return (
    <section id="compare" className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[oklch(0.22_0.045_250)]">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className={sectionEyebrowClass}>Decision table</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <Badge variant="outline" className="w-fit rounded-full">
              {plans.length} active plans
            </Badge>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead>
                <tr className="border-b text-[oklch(0.45_0.06_250)] dark:text-white/60">
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">CPU</th>
                  <th className="py-2 pr-3 font-medium">RAM</th>
                  <th className="py-2 pr-3 font-medium">Storage</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={`compare-${plan.id}`}
                    className="border-b transition-colors last:border-b-0 hover:bg-[oklch(0.97_0.03_88)]/70 dark:hover:bg-white/5"
                  >
                    <td className="py-2 pr-3 font-medium">{plan.name}</td>
                    <td className="py-2 pr-3">{plan.cpu} vCPU</td>
                    <td className="py-2 pr-3">{plan.ram} GB</td>
                    <td className="py-2 pr-3">{plan.storage} GB</td>
                    <td className="py-2 pr-3">{plan.planType}</td>
                    <td className="py-2 pr-3">{plan.planLocation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

interface TestimonialsSectionProps {
  displayClassName: string
  content: TestimonialsContent
}

export function TestimonialsSection({
  displayClassName,
  content,
}: TestimonialsSectionProps) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="max-w-3xl">
          <p className={sectionEyebrowClass}>{content.eyebrow}</p>
          <h2
            className={`${displayClassName} mt-2 text-2xl tracking-tight md:text-3xl`}
          >
            {content.headline}
          </h2>
        </div>
        <div className="rounded-2xl border border-[oklch(0.84_0.07_78)]/70 bg-white/75 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/8">
          <p className="text-2xl leading-none text-[oklch(0.66_0.14_78)]">
            ★★★★★
          </p>
          <p className="mt-1 text-sm font-medium">{content.ratingLabel}</p>
        </div>
      </Reveal>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {content.items.map((testimonial, index) => (
          <Reveal key={testimonial.name} delayMs={index * 80}>
            <article
              className={`h-full rounded-2xl border p-5 shadow-sm ${
                valuePropStyles[index % valuePropStyles.length]?.card ?? ""
              } dark:border-white/10`}
            >
              <p className="text-lg leading-none text-[oklch(0.66_0.14_78)]">
                ★★★★★
              </p>
              <p className="mt-4 text-sm leading-6 text-foreground/78 dark:text-white/72">
                “{testimonial.quote}”
              </p>
              <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function FaqPreviewSection({
  displayClassName,
  content,
}: {
  displayClassName: string
  content: FaqPreviewContent
}) {
  return (
    <section className="mx-auto mt-16 grid w-full max-w-6xl gap-6 px-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Reveal className="flex flex-col gap-3">
        <p className={sectionEyebrowClass}>{content.eyebrow}</p>
        <h2
          className={`${displayClassName} text-2xl tracking-tight md:text-3xl`}
        >
          {content.headline}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          {content.description}
        </p>
        <Link href={webPaths.faq}>
          <Button size="sm" variant="outline" className="w-fit">
            {content.ctaLabel}
          </Button>
        </Link>
      </Reveal>

      <Reveal>
        <Accordion
          defaultValue={
            content.items?.[0]?.question
              ? [content.items?.[0]?.question]
              : undefined
          }
          className="w-full space-y-2 border-0"
        >
          {content.items.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="rounded-2xl border bg-white/70 px-4 dark:border-white/10 dark:bg-white/7"
            >
              <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  )
}

export function LiveSupportSection({
  displayClassName,
  content,
}: {
  displayClassName: string
  content: LiveSupportContent
}) {
  return (
    <section className="mx-auto mt-16 w-full max-w-6xl px-6">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.23_0.06_252),oklch(0.18_0.04_245)_55%,oklch(0.22_0.065_198))] p-6 text-white shadow-xl shadow-[oklch(0.45_0.1_220)]/18 md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.13_205),oklch(0.72_0.12_166),oklch(0.77_0.12_78))]" />
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
                {content.eyebrow}
              </p>
              <h2
                className={`${displayClassName} mt-2 text-2xl tracking-tight md:text-3xl`}
              >
                {content.headline}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
                {content.description}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {content.topics.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/12 bg-white/8 p-4"
                >
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

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

interface SiteFooterSectionProps {
  footer: FooterContent
  fallbackLinks: FooterColumnLink[]
}

const defaultFooterColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Plans", href: webPaths.plans },
      { label: "Pricing", href: webPaths.plans },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: webPaths.faq },
      { label: "Contact", href: webPaths.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: webPaths.terms },
      { label: "Privacy", href: webPaths.privacy },
      { label: "Refund Policy", href: webPaths.refundPolicy },
    ],
  },
]

export function SiteFooterSection({
  footer,
  fallbackLinks,
}: SiteFooterSectionProps) {
  const defaultFooterHrefs = new Set(
    defaultFooterColumns.flatMap((column) =>
      column.links.map((linkItem) => linkItem.href)
    )
  )
  const extraFallbackLinks = fallbackLinks.filter(
    (linkItem) => !defaultFooterHrefs.has(linkItem.href)
  )
  const columns =
    footer.columns.length > 0
      ? footer.columns
      : extraFallbackLinks.length > 0
        ? [
            ...defaultFooterColumns,
            {
              title: "More",
              links: extraFallbackLinks,
            },
          ]
        : defaultFooterColumns

  return (
    <footer className="mx-auto mt-12 w-full max-w-6xl px-6 pb-4">
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card">
          <div className="grid gap-8 border-b border-border/70 p-6 md:grid-cols-[1.2fr_1fr] lg:p-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
                TrueRDP
              </span>
              <p className="max-w-md text-sm text-muted-foreground">
                {footer.tagline}
              </p>
              {/* Removed top-level badge links to avoid duplicate nav elements.
                  Footer links are rendered in columns below; keep badges removed
                  to match header which no longer shows the top-level pills. */}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title} className="space-y-3">
                  <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {column.title}
                  </p>
                  <div className="flex flex-col gap-2">
                    {column.links.map((linkItem) => (
                      <Link
                        key={`${column.title}-${linkItem.label}-${linkItem.href}`}
                        href={linkItem.href}
                        className="text-sm text-foreground/85 transition-colors hover:text-foreground"
                      >
                        {linkItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-muted-foreground lg:px-8">
            <p>{footer.copyrightText}</p>
            <p className="inline-flex items-center gap-1.5">
              <HugeiconsIcon
                icon={CheckmarkBadgeIcon}
                size={14}
                strokeWidth={2}
              />
              Production-ready checkout and billing flow
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  )
}

export interface HomeSectionsInput {
  displayClassName: string
  hero: HeroContent
  valueProps: ValueProp[]
  journeySection: JourneySectionContent
  valuePropsSection: SectionIntro
  sections: SectionLabels
  locationSection: LocationSectionContent
  testimonialsSection: TestimonialsContent
  faqPreviewSection: FaqPreviewContent
  liveSupportSection: LiveSupportContent
  finalCta: FinalCta
  plans: Plan[]
  featuredPlans: Plan[]
  cheapestOption: PlanPricingOption | null
  planCountLabel: string
  uniqueLocations: number
  uniqueTypes: number
  plansByLocation: Record<string, Plan[]>
}

export function HomeSections({
  displayClassName,
  hero,
  valueProps,
  journeySection,
  valuePropsSection,
  sections,
  locationSection,
  testimonialsSection,
  faqPreviewSection,
  liveSupportSection,
  finalCta,
  plans,
  featuredPlans,
  cheapestOption,
  planCountLabel,
  uniqueLocations,
  uniqueTypes,
  plansByLocation,
}: HomeSectionsInput) {
  return (
    <>
      <HeroSection
        displayClassName={displayClassName}
        hero={hero}
        planCountLabel={planCountLabel}
        uniqueLocations={uniqueLocations}
        uniqueTypes={uniqueTypes}
        cheapestOption={cheapestOption}
      />

      <JourneySection
        displayClassName={displayClassName}
        content={journeySection}
      />

      <ValuePropsSection section={valuePropsSection} valueProps={valueProps} />

      {featuredPlans.length > 0 ? (
        <FeaturedPlansSection
          displayClassName={displayClassName}
          plans={featuredPlans}
          title={sections.featuredPlansTitle}
          description={sections.featuredPlansDescription}
        />
      ) : null}

      {plans.length > 0 ? (
        <CatalogInsightsSection
          plansByLocation={plansByLocation}
          content={locationSection}
        />
      ) : null}

      {plans.length > 0 ? (
        <ComparisonSection
          plans={plans}
          title={sections.comparisonTitle}
          description={sections.comparisonDescription}
        />
      ) : null}

      <TestimonialsSection
        displayClassName={displayClassName}
        content={testimonialsSection}
      />

      <FaqPreviewSection
        displayClassName={displayClassName}
        content={faqPreviewSection}
      />

      <LiveSupportSection
        displayClassName={displayClassName}
        content={liveSupportSection}
      />

      <FinalCtaSection
        displayClassName={displayClassName}
        content={finalCta}
        cheapestOption={cheapestOption}
      />
    </>
  )
}
