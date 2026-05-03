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

export interface HeroContent {
  badge: string
  headline: string
  description: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  trustLine: string
}

export interface ValueProp {
  title: string
  description: string
}

export interface JourneyStep {
  title: string
  description: string
  details: string[]
}

export interface SectionIntro {
  eyebrow: string
  headline: string
  description?: string
  ctaLabel?: string
}

export interface JourneySectionContent extends SectionIntro {
  steps: JourneyStep[]
}

export interface SectionLabels {
  featuredPlansTitle: string
  featuredPlansDescription: string
  planGroupsTitle: string
  planLocationsTitle: string
  comparisonTitle: string
  comparisonDescription: string
}

export interface FinalCta {
  headline: string
  description: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
}

export interface Testimonial {
  quote: string
  name: string
  role: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface TestimonialsContent extends SectionIntro {
  ratingLabel: string
  items: Testimonial[]
}

export interface FaqPreviewContent extends SectionIntro {
  items: FaqItem[]
}

export interface LiveSupportTopic {
  title: string
  description: string
}

export interface LiveSupportContent extends SectionIntro {
  topics: LiveSupportTopic[]
}

export interface LocationSectionContent extends SectionIntro {
  footerTitle: string
  footerDescription: string
  ctaLabel: string
}

export interface FooterColumnLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: FooterColumnLink[]
}

export interface FooterContent {
  tagline: string
  copyrightText: string
  columns: FooterColumn[]
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
