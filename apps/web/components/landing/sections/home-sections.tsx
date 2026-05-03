import { CatalogInsightsSection } from "./catalog-insights-section"
import { ComparisonSection } from "./comparison-section"
import { FaqPreviewSection } from "./faq-preview-section"
import { FeaturedPlansSection } from "./featured-plans-section"
import { FinalCtaSection } from "./final-cta-section"
import { HeroSection } from "./hero-section"
import { JourneySection } from "./journey-section"
import { LiveSupportSection } from "./live-support-section"
import { TestimonialsSection } from "./testimonials-section"
import { ValuePropsSection } from "./value-props-section"
import type { HomeSectionsInput } from "./types"

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
