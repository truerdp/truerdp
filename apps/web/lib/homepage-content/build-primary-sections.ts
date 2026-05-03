import { fallbackJourneyDetails, getJourneyDetails, readRecord, readText } from "@/lib/homepage-content/utils"

export function buildPrimaryHomeSections(cmsContent: Record<string, unknown>) {
  const cmsHero = readRecord(cmsContent.hero)
  const hero = {
    badge: readText(cmsHero.badge, "Premium RDP plans with instant checkout"),
    headline: readText(
      cmsHero.headline,
      "Choose a fast Windows RDP plan without the usual infrastructure guesswork"
    ),
    description: readText(
      cmsHero.description,
      "Compare CPU, RAM, storage, location, and duration in one place, then move from plan selection to checkout without waiting on a sales call."
    ),
    primaryCtaLabel: readText(cmsHero.primaryCtaLabel, "Create account"),
    secondaryCtaLabel: readText(cmsHero.secondaryCtaLabel, "See how setup works"),
    trustLine: readText(
      cmsHero.trustLine,
      "Transparent plan specs, checkout-ready pricing, and a clean path from selection to provisioning."
    ),
  }

  const cmsValueProps = Array.isArray(cmsContent.valueProps)
    ? (cmsContent.valueProps as Array<Record<string, unknown>>)
    : []
  const valueProps =
    cmsValueProps.length > 0
      ? cmsValueProps
          .map((item) => ({
            title: readText(item.title, ""),
            description: readText(item.description, ""),
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

  const cmsValuePropsSection = readRecord(cmsContent.valuePropsSection)
  const valuePropsSection = {
    eyebrow: readText(cmsValuePropsSection.eyebrow, "Why teams choose TrueRDP"),
    headline: readText(
      cmsValuePropsSection.headline,
      "Built for buyers who want the right machine without a long sales loop"
    ),
  }

  const cmsJourneySection = readRecord(cmsContent.journeySection)
  const cmsJourneySteps = Array.isArray(cmsJourneySection.steps)
    ? (cmsJourneySection.steps as Array<Record<string, unknown>>)
    : []
  const journeySection = {
    eyebrow: readText(cmsJourneySection.eyebrow, "How it works"),
    headline: readText(
      cmsJourneySection.headline,
      "From selection to server access in three clear steps"
    ),
    description: readText(
      cmsJourneySection.description,
      "The buying path stays simple for customers: compare the plan, complete checkout, and let support finish provisioning."
    ),
    steps:
      cmsJourneySteps.length > 0
        ? cmsJourneySteps
            .map((item) => ({
              title: readText(item.title, ""),
              description: readText(item.description, ""),
              details: getJourneyDetails(item, readText(item.title, "")),
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

  const cmsSections = readRecord(cmsContent.sections)
  const sections = {
    featuredPlansTitle: readText(cmsSections.featuredPlansTitle, "Featured plans"),
    featuredPlansDescription: readText(
      cmsSections.featuredPlansDescription,
      "Start with the strongest inventory and compare real durations before checkout."
    ),
    planGroupsTitle: readText(cmsSections.planGroupsTitle, "Plans by Type"),
    planLocationsTitle: readText(cmsSections.planLocationsTitle, "Plans by Location"),
    comparisonTitle: readText(cmsSections.comparisonTitle, "Plan comparison"),
    comparisonDescription: readText(
      cmsSections.comparisonDescription,
      "Scan resources, geography, and workload lanes side-by-side before you commit."
    ),
  }

  const cmsLocationSection = readRecord(cmsContent.locationSection)
  const locationSection = {
    eyebrow: readText(cmsLocationSection.eyebrow, "Deployment locations"),
    headline: readText(
      cmsLocationSection.headline,
      "Pick the region that keeps your RDP workflow close to where it runs"
    ),
    description: readText(
      cmsLocationSection.description,
      "Browse active availability by geography, then compare the matching plan resources and durations."
    ),
    footerTitle: readText(cmsLocationSection.footerTitle, sections.planLocationsTitle),
    footerDescription: readText(
      cmsLocationSection.footerDescription,
      "Location cards update from active backend inventory."
    ),
    ctaLabel: readText(cmsLocationSection.ctaLabel, "Browse all plans"),
  }

  return {
    hero,
    valueProps,
    valuePropsSection,
    journeySection,
    sections,
    locationSection,
  }
}
