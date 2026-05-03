export type PortableTextBlock = Record<string, unknown>

export type CmsPage = {
  id?: number
  slug: string
  title: string
  summary: string | null
  content: Record<string, unknown>
  seoTitle: string | null
  seoDescription: string | null
  isPublished?: boolean
  publishedAt?: string | null
  updatedAt?: string
}

export type CmsPageSlug =
  | "homepage"
  | "faq"
  | "terms"
  | "privacy"
  | "refund-policy"
  | "contact"

export type SiteSettings = {
  brandName: string
  headerLinks: Array<{
    label?: string
    href?: string
  }>
  footerLinks: Array<{
    label?: string
    href?: string
  }>
  footer: {
    tagline?: string
    copyrightText?: string
    statusText?: string
    columns?: Array<{
      title?: string
      links?: Array<{
        label?: string
        href?: string
      }>
    }>
  }
}

export type HomePageDocument = {
  title?: string
  summary?: string | null
  hero?: {
    badge?: string
    headline?: string
    description?: string
    primaryCtaLabel?: string
    secondaryCtaLabel?: string
    trustLine?: string
  }
  valueProps?: Array<{
    title?: string
    description?: string
  }>
  valuePropsSection?: {
    eyebrow?: string
    headline?: string
  }
  journeySection?: {
    eyebrow?: string
    headline?: string
    description?: string
    steps?: Array<{
      title?: string
      description?: string
      details?: string[]
    }>
  }
  sections?: {
    featuredPlansTitle?: string
    featuredPlansDescription?: string
    planGroupsTitle?: string
    planLocationsTitle?: string
    comparisonTitle?: string
    comparisonDescription?: string
  }
  locationSection?: {
    eyebrow?: string
    headline?: string
    description?: string
    footerTitle?: string
    footerDescription?: string
    ctaLabel?: string
  }
  testimonialsSection?: {
    eyebrow?: string
    headline?: string
    ratingLabel?: string
    items?: Array<{
      quote?: string
      name?: string
      role?: string
    }>
  }
  faqPreviewSection?: {
    eyebrow?: string
    headline?: string
    description?: string
    ctaLabel?: string
    items?: Array<{
      question?: string
      answer?: string
    }>
  }
  liveSupportSection?: {
    eyebrow?: string
    headline?: string
    description?: string
    topics?: Array<{
      title?: string
      description?: string
    }>
  }
  finalCta?: {
    headline?: string
    description?: string
    primaryCtaLabel?: string
    secondaryCtaLabel?: string
  }
  seoTitle?: string | null
  seoDescription?: string | null
}

export type SiteSettingsDocument = {
  brandName?: string
  headerLinks?: SiteSettings["headerLinks"]
  footerLinks?: SiteSettings["footerLinks"]
  footer?: SiteSettings["footer"]
}

export type FaqPageDocument = {
  title?: string
  summary?: string | null
  items?: Array<{
    question?: string
    answer?: string
  }>
  seoTitle?: string | null
  seoDescription?: string | null
}

export type LegalPageDocument = {
  title?: string
  summary?: string | null
  body?: PortableTextBlock[]
  seoTitle?: string | null
  seoDescription?: string | null
}
