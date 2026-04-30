import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"

import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import { serverApi } from "@workspace/api"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"

import { HomeAutoCheckout } from "@/components/home-checkout-actions"
import {
  type Plan,
  type PlanPricingOption,
  HomeSections,
} from "@/components/landing/sections"
import { getCmsPage } from "@/lib/cms"

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
})

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getCmsPage("homepage")
  return {
    title: homepage.seoTitle || homepage.title,
    description:
      homepage.seoDescription ||
      "Deploy high-performance Windows RDP in minutes with transparent plans and instant checkout.",
  }
}

async function getPlans() {
  try {
    const plans = await serverApi<Plan[]>("/plans", {
      cache: "no-store",
    })

    return { plans, error: null }
  } catch (error) {
    return {
      plans: [] as Plan[],
      error: error instanceof Error ? error.message : "Unable to load plans",
    }
  }
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

const fallbackJourneyDetails: Record<string, string[]> = {
  choose: [
    "Start with plan type, location, and resource requirements.",
    "Review available durations and starting price before checkout.",
    "Use the comparison table if you need to scan every spec side-by-side.",
  ],
  checkout: [
    "Confirm the selected duration and plan price.",
    "Sign in or create an account so the order stays attached to you.",
    "Move into the secure payment review flow without repeating plan details.",
  ],
  provision: [
    "Payment confirmation creates the provisioning request for the team.",
    "Support assigns the matching RDP resources from available inventory.",
    "Access details and next steps are handled through the customer flow.",
  ],
}

function getJourneyDetails(item: Record<string, unknown>, title: string) {
  const details = Array.isArray(item.details)
    ? item.details.filter(
        (detail): detail is string => typeof detail === "string"
      )
    : []

  if (details.length > 0) {
    return details
  }

  return fallbackJourneyDetails[title.toLowerCase()] ?? []
}

export default async function Page() {
  const { plans, error } = await getPlans()
  const homepage = await getCmsPage("homepage")

  const cmsContent = homepage.content as Record<string, unknown>

  const cmsHero = (cmsContent.hero as Record<string, unknown> | undefined) ?? {}
  const hero = {
    badge:
      (typeof cmsHero.badge === "string" && cmsHero.badge) ||
      "Premium RDP plans with instant checkout",
    headline:
      (typeof cmsHero.headline === "string" && cmsHero.headline) ||
      "Choose a fast Windows RDP plan without the usual infrastructure guesswork",
    description:
      (typeof cmsHero.description === "string" && cmsHero.description) ||
      "Compare CPU, RAM, storage, location, and duration in one place, then move from plan selection to checkout without waiting on a sales call.",
    primaryCtaLabel:
      (typeof cmsHero.primaryCtaLabel === "string" &&
        cmsHero.primaryCtaLabel) ||
      "Create account",
    secondaryCtaLabel:
      (typeof cmsHero.secondaryCtaLabel === "string" &&
        cmsHero.secondaryCtaLabel) ||
      "See how setup works",
    trustLine:
      (typeof cmsHero.trustLine === "string" && cmsHero.trustLine) ||
      "Transparent plan specs, checkout-ready pricing, and a clean path from selection to provisioning.",
  }

  const cmsValueProps = Array.isArray(cmsContent.valueProps)
    ? (cmsContent.valueProps as Array<Record<string, unknown>>)
    : []
  const valueProps =
    cmsValueProps.length > 0
      ? cmsValueProps
          .map((item) => ({
            title: typeof item.title === "string" ? item.title : "",
            description:
              typeof item.description === "string" ? item.description : "",
          }))
          .filter((item) => item.title && item.description)
      : [
          {
            title: "Specs you can compare quickly",
            description:
              "Every plan surfaces the concrete CPU, memory, storage, location, and duration details buyers need before payment.",
          },
          {
            title: "Checkout without back-and-forth",
            description:
              "Choose a billing duration and go straight into order creation with session-aware redirect handling.",
          },
          {
            title: "Locations and plan types stay clear",
            description:
              "Browse by workload lane or deployment region so latency, geography, and resources stay easy to reason about.",
          },
        ]

  const cmsValuePropsSection =
    (cmsContent.valuePropsSection as Record<string, unknown> | undefined) ?? {}
  const valuePropsSection = {
    eyebrow:
      (typeof cmsValuePropsSection.eyebrow === "string" &&
        cmsValuePropsSection.eyebrow) ||
      "Why teams choose TrueRDP",
    headline:
      (typeof cmsValuePropsSection.headline === "string" &&
        cmsValuePropsSection.headline) ||
      "Built for buyers who want the right machine without a long sales loop",
  }

  const cmsJourneySection =
    (cmsContent.journeySection as Record<string, unknown> | undefined) ?? {}
  const cmsJourneySteps = Array.isArray(cmsJourneySection.steps)
    ? (cmsJourneySection.steps as Array<Record<string, unknown>>)
    : []
  const journeySection = {
    eyebrow:
      (typeof cmsJourneySection.eyebrow === "string" &&
        cmsJourneySection.eyebrow) ||
      "How it works",
    headline:
      (typeof cmsJourneySection.headline === "string" &&
        cmsJourneySection.headline) ||
      "From selection to server access in three clear steps",
    description:
      (typeof cmsJourneySection.description === "string" &&
        cmsJourneySection.description) ||
      "The buying path stays simple for customers: compare the plan, complete checkout, and let support finish provisioning.",
    steps:
      cmsJourneySteps.length > 0
        ? cmsJourneySteps
            .map((item) => ({
              title: typeof item.title === "string" ? item.title : "",
              description:
                typeof item.description === "string" ? item.description : "",
              details: getJourneyDetails(
                item,
                typeof item.title === "string" ? item.title : ""
              ),
            }))
            .filter((item) => item.title && item.description)
        : [
            {
              title: "Choose",
              description:
                "Compare CPU, RAM, storage, duration, and region before selecting the right RDP plan.",
              details: fallbackJourneyDetails.choose ?? [],
            },
            {
              title: "Checkout",
              description:
                "Create the order through the guided checkout flow with the plan details already confirmed.",
              details: fallbackJourneyDetails.checkout ?? [],
            },
            {
              title: "Provision",
              description:
                "After payment confirmation, support prepares access and follows through on setup.",
              details: fallbackJourneyDetails.provision ?? [],
            },
          ],
  }

  const cmsSections =
    (cmsContent.sections as Record<string, unknown> | undefined) ?? {}
  const sections = {
    featuredPlansTitle:
      (typeof cmsSections.featuredPlansTitle === "string" &&
        cmsSections.featuredPlansTitle) ||
      "Featured plans",
    featuredPlansDescription:
      (typeof cmsSections.featuredPlansDescription === "string" &&
        cmsSections.featuredPlansDescription) ||
      "Start with the strongest inventory and compare real durations before checkout.",
    planGroupsTitle:
      (typeof cmsSections.planGroupsTitle === "string" &&
        cmsSections.planGroupsTitle) ||
      "Plans by Type",
    planLocationsTitle:
      (typeof cmsSections.planLocationsTitle === "string" &&
        cmsSections.planLocationsTitle) ||
      "Plans by Location",
    comparisonTitle:
      (typeof cmsSections.comparisonTitle === "string" &&
        cmsSections.comparisonTitle) ||
      "Plan comparison",
    comparisonDescription:
      (typeof cmsSections.comparisonDescription === "string" &&
        cmsSections.comparisonDescription) ||
      "Scan resources, geography, and workload lanes side-by-side before you commit.",
  }

  const cmsLocationSection =
    (cmsContent.locationSection as Record<string, unknown> | undefined) ?? {}
  const locationSection = {
    eyebrow:
      (typeof cmsLocationSection.eyebrow === "string" &&
        cmsLocationSection.eyebrow) ||
      "Deployment locations",
    headline:
      (typeof cmsLocationSection.headline === "string" &&
        cmsLocationSection.headline) ||
      "Pick the region that keeps your RDP workflow close to where it runs",
    description:
      (typeof cmsLocationSection.description === "string" &&
        cmsLocationSection.description) ||
      "Browse active availability by geography, then compare the matching plan resources and durations.",
    footerTitle:
      (typeof cmsLocationSection.footerTitle === "string" &&
        cmsLocationSection.footerTitle) ||
      sections.planLocationsTitle,
    footerDescription:
      (typeof cmsLocationSection.footerDescription === "string" &&
        cmsLocationSection.footerDescription) ||
      "Location cards update from active backend inventory.",
    ctaLabel:
      (typeof cmsLocationSection.ctaLabel === "string" &&
        cmsLocationSection.ctaLabel) ||
      "Browse all plans",
  }

  const cmsTestimonialsSection =
    (cmsContent.testimonialsSection as Record<string, unknown> | undefined) ??
    {}
  const cmsTestimonialsItems = Array.isArray(cmsTestimonialsSection.items)
    ? (cmsTestimonialsSection.items as Array<Record<string, unknown>>)
    : []
  const testimonialsSection = {
    eyebrow:
      (typeof cmsTestimonialsSection.eyebrow === "string" &&
        cmsTestimonialsSection.eyebrow) ||
      "5 star rated experience",
    headline:
      (typeof cmsTestimonialsSection.headline === "string" &&
        cmsTestimonialsSection.headline) ||
      "Trusted by buyers who need clear specs and quick checkout",
    ratingLabel:
      (typeof cmsTestimonialsSection.ratingLabel === "string" &&
        cmsTestimonialsSection.ratingLabel) ||
      "Rated 5.0 by customers",
    items:
      cmsTestimonialsItems.length > 0
        ? cmsTestimonialsItems
            .map((item) => ({
              quote: typeof item.quote === "string" ? item.quote : "",
              name: typeof item.name === "string" ? item.name : "",
              role: typeof item.role === "string" ? item.role : "",
            }))
            .filter((item) => item.quote && item.name)
        : [
            {
              quote:
                "The plan cards made it easy to compare capacity and get into checkout without a slow quote process.",
              name: "Arjun M.",
              role: "Automation operator",
            },
            {
              quote:
                "We needed remote Windows capacity quickly. TrueRDP gave us clear durations, specs, and locations up front.",
              name: "Meera S.",
              role: "Operations lead",
            },
            {
              quote:
                "The buying flow is simple, and the resource details are visible before payment. That saves a lot of back-and-forth.",
              name: "Daniel K.",
              role: "Trading desk admin",
            },
          ],
  }

  const cmsFaqPreviewSection =
    (cmsContent.faqPreviewSection as Record<string, unknown> | undefined) ?? {}
  const cmsFaqPreviewItems = Array.isArray(cmsFaqPreviewSection.items)
    ? (cmsFaqPreviewSection.items as Array<Record<string, unknown>>)
    : []
  const faqPreviewSection = {
    eyebrow:
      (typeof cmsFaqPreviewSection.eyebrow === "string" &&
        cmsFaqPreviewSection.eyebrow) ||
      "Quick answers",
    headline:
      (typeof cmsFaqPreviewSection.headline === "string" &&
        cmsFaqPreviewSection.headline) ||
      "Know what happens before you choose a plan",
    description:
      (typeof cmsFaqPreviewSection.description === "string" &&
        cmsFaqPreviewSection.description) ||
      "The common buying questions are answered up front, and the full FAQ is available when you need more detail.",
    ctaLabel:
      (typeof cmsFaqPreviewSection.ctaLabel === "string" &&
        cmsFaqPreviewSection.ctaLabel) ||
      "Open full FAQ",
    items:
      cmsFaqPreviewItems.length > 0
        ? cmsFaqPreviewItems
            .map((item) => ({
              question: typeof item.question === "string" ? item.question : "",
              answer: typeof item.answer === "string" ? item.answer : "",
            }))
            .filter((item) => item.question && item.answer)
        : [
            {
              question: "How quickly can I place an order?",
              answer:
                "Choose a plan duration, start checkout, and the order is created in the same flow. Provisioning follows the current admin confirmation process.",
            },
            {
              question: "Can I compare plans by location?",
              answer:
                "Yes. The homepage and plans catalog both group inventory by plan type and deployment location so you can evaluate latency and geography before checkout.",
            },
            {
              question: "What details are shown before payment?",
              answer:
                "Plan cards show CPU, RAM, storage, location, plan type, and available durations so you can choose without hidden assumptions.",
            },
          ],
  }

  const cmsLiveSupportSection =
    (cmsContent.liveSupportSection as Record<string, unknown> | undefined) ?? {}
  const cmsLiveSupportTopics = Array.isArray(cmsLiveSupportSection.topics)
    ? (cmsLiveSupportSection.topics as Array<Record<string, unknown>>)
    : []
  const liveSupportSection = {
    eyebrow:
      (typeof cmsLiveSupportSection.eyebrow === "string" &&
        cmsLiveSupportSection.eyebrow) ||
      "Live support",
    headline:
      (typeof cmsLiveSupportSection.headline === "string" &&
        cmsLiveSupportSection.headline) ||
      "Need help choosing capacity? Chat with support before checkout.",
    description:
      (typeof cmsLiveSupportSection.description === "string" &&
        cmsLiveSupportSection.description) ||
      "Tawk.to live chat is ready for the marketing site. Use the chat widget for plan fit, order questions, and provisioning status.",
    topics:
      cmsLiveSupportTopics.length > 0
        ? cmsLiveSupportTopics
            .map((item) => ({
              title: typeof item.title === "string" ? item.title : "",
              description:
                typeof item.description === "string" ? item.description : "",
            }))
            .filter((item) => item.title)
        : [
            {
              title: "Plan fit",
              description: "Support for buyers and active customers.",
            },
            {
              title: "Order questions",
              description: "Support for buyers and active customers.",
            },
            {
              title: "Provisioning status",
              description: "Support for buyers and active customers.",
            },
          ],
  }

  const cmsFinalCta =
    (cmsContent.finalCta as Record<string, unknown> | undefined) ?? {}
  const finalCta = {
    headline:
      (typeof cmsFinalCta.headline === "string" && cmsFinalCta.headline) ||
      "Ready to launch a cleaner RDP workspace?",
    description:
      (typeof cmsFinalCta.description === "string" &&
        cmsFinalCta.description) ||
      "Pick a plan that fits your workload, choose the duration, and move into payment with the core details already visible.",
    primaryCtaLabel:
      (typeof cmsFinalCta.primaryCtaLabel === "string" &&
        cmsFinalCta.primaryCtaLabel) ||
      "Start now",
    secondaryCtaLabel:
      (typeof cmsFinalCta.secondaryCtaLabel === "string" &&
        cmsFinalCta.secondaryCtaLabel) ||
      "Talk to support",
  }

  const sortedPlans = [...plans].sort((a, b) => {
    const lowestA =
      getLowestPricingOption(a)?.priceUsdCents ?? Number.MAX_SAFE_INTEGER
    const lowestB =
      getLowestPricingOption(b)?.priceUsdCents ?? Number.MAX_SAFE_INTEGER
    return lowestA - lowestB
  })

  const featuredPlans = sortedPlans.filter((plan) => plan.isFeatured)
  const cheapestPlan = sortedPlans[0]
  const cheapestOption = cheapestPlan
    ? getLowestPricingOption(cheapestPlan)
    : null
  const uniqueLocations = new Set(plans.map((plan) => plan.planLocation)).size
  const uniqueTypes = new Set(plans.map((plan) => plan.planType)).size

  const planCountLabel =
    plans.length === 0
      ? "No active plans"
      : `${plans.length} active plan${plans.length > 1 ? "s" : ""}`

  const plansByLocation = plans.reduce<Record<string, Plan[]>>((acc, plan) => {
    const key = plan.planLocation

    if (!acc[key]) {
      acc[key] = []
    }

    acc[key].push(plan)
    return acc
  }, {})

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_46%,oklch(0.985_0.018_166)_100%)] pb-14 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      <HomeAutoCheckout />

      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-180 bg-[linear-gradient(115deg,oklch(0.95_0.05_78/0.62)_0%,transparent_34%),linear-gradient(245deg,oklch(0.82_0.075_205/0.45)_0%,transparent_44%),linear-gradient(180deg,oklch(1_0_0/0.34),transparent_78%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-180 bg-[linear-gradient(90deg,transparent_0,transparent_48%,oklch(0.56_0.1_205/0.06)_48%,oklch(0.56_0.1_205/0.06)_52%,transparent_52%,transparent_100%)]" />

      {error ? (
        <section className="mx-auto mt-8 w-full max-w-6xl px-6">
          <Alert variant="destructive">
            <HugeiconsIcon icon={CreditCardIcon} size={18} strokeWidth={2} />
            <AlertTitle>Unable to load plans</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </section>
      ) : null}

      <HomeSections
        displayClassName={displayFont.className}
        hero={hero}
        valueProps={valueProps}
        journeySection={journeySection}
        valuePropsSection={valuePropsSection}
        sections={sections}
        locationSection={locationSection}
        testimonialsSection={testimonialsSection}
        faqPreviewSection={faqPreviewSection}
        liveSupportSection={liveSupportSection}
        finalCta={finalCta}
        plans={plans}
        featuredPlans={featuredPlans}
        cheapestOption={cheapestOption}
        planCountLabel={planCountLabel}
        uniqueLocations={uniqueLocations}
        uniqueTypes={uniqueTypes}
        plansByLocation={plansByLocation}
      />
    </main>
  )
}
