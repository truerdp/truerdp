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
import { type Plan, HomeSections } from "@/components/landing/sections"
import { getCmsPage } from "@/lib/cms"
import { buildHomeContent, buildPlanInsights } from "@/lib/homepage-content"

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

export default async function Page() {
  const { plans, error } = await getPlans()
  const homepage = await getCmsPage("homepage")
  const cmsContent = homepage.content as Record<string, unknown>

  const homeContent = buildHomeContent(cmsContent)
  const planInsights = buildPlanInsights(plans)

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
        hero={homeContent.hero}
        valueProps={homeContent.valueProps}
        journeySection={homeContent.journeySection}
        valuePropsSection={homeContent.valuePropsSection}
        sections={homeContent.sections}
        locationSection={homeContent.locationSection}
        testimonialsSection={homeContent.testimonialsSection}
        faqPreviewSection={homeContent.faqPreviewSection}
        liveSupportSection={homeContent.liveSupportSection}
        finalCta={homeContent.finalCta}
        plans={plans}
        featuredPlans={planInsights.featuredPlans}
        cheapestOption={planInsights.cheapestOption}
        planCountLabel={planInsights.planCountLabel}
        uniqueLocations={planInsights.uniqueLocations}
        uniqueTypes={planInsights.uniqueTypes}
        plansByLocation={planInsights.plansByLocation}
      />
    </main>
  )
}
