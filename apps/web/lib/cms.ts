import { isSanityConfigured, sanityFetch } from "@/lib/sanity"

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

type CmsPageSlug =
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

const fallbackSiteSettings: SiteSettings = {
  brandName: "TrueRDP",
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "All Plans", href: "/plans" },
    { label: "Dedicated RDP", href: "/plans/dedicated" },
    { label: "Residential RDP", href: "/plans/residential" },
  ],
  footerLinks: [
    { label: "FAQ", href: "/faq" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Contact & Support", href: "/contact" },
  ],
  footer: {
    tagline:
      "High-performance Windows RDP plans for focused, always-on workloads.",
    copyrightText: "Copyright 2026 TrueRDP. All rights reserved.",
    statusText: "Production-ready checkout and billing flow",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Plans", href: "/plans" },
          { label: "Pricing", href: "/plans" },
          { label: "Checkout", href: "/plans" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Terms", href: "/terms" },
          { label: "Privacy", href: "/privacy" },
          { label: "Refund Policy", href: "/refund-policy" },
        ],
      },
    ],
  },
}

const fallbackPages: Record<CmsPageSlug, CmsPage> = {
  homepage: {
    slug: "homepage",
    title: "TrueRDP Plans",
    summary: "Browse plans and start checkout.",
    content: {
      hero: {
        badge: "Instant setup workflow",
        headline: "Choose a TrueRDP plan and start your order in minutes",
        description:
          "Select duration, pick a payment method, and generate a transaction. Provisioning is handled by admin confirmation in the current flow.",
        primaryCtaLabel: "Start checkout",
        secondaryCtaLabel: "How it works",
        trustLine:
          "Low-latency infrastructure with transparent plan comparisons.",
      },
      valueProps: [
        {
          title: "Performance-first plans",
          description:
            "Concrete CPU, RAM, and storage specs make infrastructure choices predictable.",
        },
        {
          title: "Straightforward purchase flow",
          description:
            "Plan selection and checkout initiation are optimized for low friction.",
        },
        {
          title: "Location and type clarity",
          description:
            "Plan grouping by type and geography keeps decision-making quick and transparent.",
          },
        ],
      valuePropsSection: {
        eyebrow: "Why teams choose TrueRDP",
        headline:
          "Built for buyers who want the right machine without a long sales loop",
      },
      journeySection: {
        eyebrow: "How it works",
        headline: "From selection to server access in three clear steps",
        description:
          "The buying path stays simple for customers: compare the plan, complete checkout, and let support finish provisioning.",
        steps: [
          {
            title: "Choose",
            description:
              "Compare CPU, RAM, storage, duration, and region before selecting the right RDP plan.",
            details: [
              "Start with plan type, location, and resource requirements.",
              "Review available durations and starting price before checkout.",
              "Use the comparison table if you need to scan every spec side-by-side.",
            ],
          },
          {
            title: "Checkout",
            description:
              "Create the order through the guided checkout flow with the plan details already confirmed.",
            details: [
              "Confirm the selected duration and plan price.",
              "Sign in or create an account so the order stays attached to you.",
              "Move into the secure payment review flow without repeating plan details.",
            ],
          },
          {
            title: "Provision",
            description:
              "After payment confirmation, support prepares access and follows through on setup.",
            details: [
              "Payment confirmation creates the provisioning request for the team.",
              "Support assigns the matching RDP resources from available inventory.",
              "Access details and next steps are handled through the customer flow.",
            ],
          },
        ],
      },
      sections: {
        featuredPlansTitle: "Featured plans",
        featuredPlansDescription:
          "Compare entry prices and launch the right environment in minutes.",
        planGroupsTitle: "Plans by Type",
        planLocationsTitle: "Plans by Location",
        comparisonTitle: "Plan comparison",
        comparisonDescription:
          "Use this matrix to compare plan resources and locations before checkout.",
      },
      locationSection: {
        eyebrow: "Deployment locations",
        headline:
          "Pick the region that keeps your RDP workflow close to where it runs",
        description:
          "Browse active availability by geography, then compare the matching plan resources and durations.",
        footerTitle: "Plans by Location",
        footerDescription:
          "Location cards update from active backend inventory.",
        ctaLabel: "Browse all plans",
      },
      testimonialsSection: {
        eyebrow: "5 star rated experience",
        headline: "Trusted by buyers who need clear specs and quick checkout",
        ratingLabel: "Rated 5.0 by customers",
        items: [
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
      },
      faqPreviewSection: {
        eyebrow: "Quick answers",
        headline: "Know what happens before you choose a plan",
        description:
          "The common buying questions are answered up front, and the full FAQ is available when you need more detail.",
        ctaLabel: "Open full FAQ",
        items: [
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
      },
      liveSupportSection: {
        eyebrow: "Live support",
        headline:
          "Need help choosing capacity? Chat with support before checkout.",
        description:
          "Tawk.to live chat is ready for the marketing site. Use the chat widget for plan fit, order questions, and provisioning status.",
        topics: [
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
      },
      finalCta: {
        headline: "Ready to launch your next RDP workspace?",
        description:
          "Select the right plan and move from browsing to order creation in a single streamlined flow.",
        primaryCtaLabel: "Start now",
        secondaryCtaLabel: "Contact support",
      },
    },
    seoTitle: "TrueRDP Plans",
    seoDescription:
      "Browse TrueRDP hosting plans, compare pricing, and start checkout instantly.",
  },
  faq: {
    slug: "faq",
    title: "Frequently Asked Questions",
    summary: "Common answers about plans, payments, and provisioning.",
    content: {
      items: [
        {
          question: "How quickly are instances provisioned?",
          answer:
            "After payment confirmation, admin provisions and assigns a server. Provisioning time depends on queue and inventory.",
        },
        {
          question: "Can I renew before expiry?",
          answer:
            "Yes. Renewals extend your expiry date. Suspended instances must be unsuspended before renewal.",
        },
        {
          question: "Which payment methods are available?",
          answer:
            "Available methods include UPI, USDT TRC20, Dodo checkout, and CoinGate checkout based on configuration.",
        },
      ],
    },
    seoTitle: "FAQ | TrueRDP",
    seoDescription: "Answers to common questions about plans and billing.",
  },
  terms: {
    slug: "terms",
    title: "Terms of Service",
    summary: "Terms and conditions for using TrueRDP.",
    content: {
      body: [
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Service usage" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Use the service lawfully and in accordance with acceptable use requirements.",
            },
          ],
          markDefs: [],
        },
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Billing" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Orders are billed according to selected plan pricing and duration.",
            },
          ],
          markDefs: [],
        },
      ],
    },
    seoTitle: "Terms of Service | TrueRDP",
    seoDescription: "Terms and conditions for TrueRDP services.",
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "How TrueRDP handles personal data.",
    content: {
      body: [
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Data collected" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "We collect account, billing, and operational data needed to provide the service.",
            },
          ],
          markDefs: [],
        },
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Data usage" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Data is used for account management, provisioning, support, and security.",
            },
          ],
          markDefs: [],
        },
      ],
    },
    seoTitle: "Privacy Policy | TrueRDP",
    seoDescription: "How TrueRDP collects, uses, and protects data.",
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund Policy",
    summary: "Refund terms for purchases and renewals.",
    content: {
      body: [
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Eligibility" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Refund eligibility depends on service usage and timing from purchase.",
            },
          ],
          markDefs: [],
        },
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Review" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Requests are reviewed case-by-case by support and admin.",
            },
          ],
          markDefs: [],
        },
      ],
    },
    seoTitle: "Refund Policy | TrueRDP",
    seoDescription: "Refund terms for TrueRDP plans and renewals.",
  },
  contact: {
    slug: "contact",
    title: "Contact & Support",
    summary: "Ways to reach support and open tickets.",
    content: {
      body: [
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Support tickets" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Open a ticket from your dashboard support page for issue tracking.",
            },
          ],
          markDefs: [],
        },
        {
          _type: "block",
          style: "h2",
          children: [{ _type: "span", text: "Response windows" }],
          markDefs: [],
        },
        {
          _type: "block",
          style: "normal",
          children: [
            {
              _type: "span",
              text: "Our team responds based on queue priority and operational impact.",
            },
          ],
          markDefs: [],
        },
      ],
    },
    seoTitle: "Contact & Support | TrueRDP",
    seoDescription: "Reach TrueRDP support for billing or provisioning help.",
  },
}

function getFallbackPage(slug: string): CmsPage | null {
  const page = (fallbackPages as Record<string, CmsPage | undefined>)[slug]
  return page ?? null
}

type HomePageDocument = {
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

type SiteSettingsDocument = {
  brandName?: string
  headerLinks?: SiteSettings["headerLinks"]
  footerLinks?: SiteSettings["footerLinks"]
  footer?: SiteSettings["footer"]
}

type FaqPageDocument = {
  title?: string
  summary?: string | null
  items?: Array<{
    question?: string
    answer?: string
  }>
  seoTitle?: string | null
  seoDescription?: string | null
}

type LegalPageDocument = {
  title?: string
  summary?: string | null
  body?: PortableTextBlock[]
  seoTitle?: string | null
  seoDescription?: string | null
}

function mapHomePageToCms(document: HomePageDocument): CmsPage {
  return {
    slug: "homepage",
    title: document.title ?? fallbackPages.homepage.title,
    summary: document.summary ?? fallbackPages.homepage.summary,
    content: {
      hero: document.hero ?? fallbackPages.homepage.content.hero,
      valueProps:
        document.valueProps ?? fallbackPages.homepage.content.valueProps,
      valuePropsSection:
        document.valuePropsSection ??
        fallbackPages.homepage.content.valuePropsSection,
      journeySection:
        document.journeySection ??
        fallbackPages.homepage.content.journeySection,
      sections: document.sections ?? fallbackPages.homepage.content.sections,
      locationSection:
        document.locationSection ??
        fallbackPages.homepage.content.locationSection,
      testimonialsSection:
        document.testimonialsSection ??
        fallbackPages.homepage.content.testimonialsSection,
      faqPreviewSection:
        document.faqPreviewSection ??
        fallbackPages.homepage.content.faqPreviewSection,
      liveSupportSection:
        document.liveSupportSection ??
        fallbackPages.homepage.content.liveSupportSection,
      finalCta: document.finalCta ?? fallbackPages.homepage.content.finalCta,
    },
    seoTitle: document.seoTitle ?? fallbackPages.homepage.seoTitle,
    seoDescription:
      document.seoDescription ?? fallbackPages.homepage.seoDescription,
  }
}

function mapSiteSettings(document: SiteSettingsDocument | null): SiteSettings {
  return {
    brandName: document?.brandName ?? fallbackSiteSettings.brandName,
    headerLinks: document?.headerLinks ?? fallbackSiteSettings.headerLinks,
    footerLinks: document?.footerLinks ?? fallbackSiteSettings.footerLinks,
    footer: {
      ...fallbackSiteSettings.footer,
      ...(document?.footer ?? {}),
    },
  }
}

function mapFaqPageToCms(document: FaqPageDocument): CmsPage {
  return {
    slug: "faq",
    title: document.title ?? fallbackPages.faq.title,
    summary: document.summary ?? fallbackPages.faq.summary,
    content: {
      items: document.items ?? fallbackPages.faq.content.items,
    },
    seoTitle: document.seoTitle ?? fallbackPages.faq.seoTitle,
    seoDescription: document.seoDescription ?? fallbackPages.faq.seoDescription,
  }
}

function mapLegalPageToCms(slug: string, document: LegalPageDocument): CmsPage {
  const fallback = getFallbackPage(slug)

  return {
    slug,
    title: document.title ?? fallback?.title ?? "Content",
    summary: document.summary ?? fallback?.summary ?? null,
    content: {
      body: document.body ?? fallback?.content.body ?? [],
    },
    seoTitle: document.seoTitle ?? fallback?.seoTitle ?? null,
    seoDescription: document.seoDescription ?? fallback?.seoDescription ?? null,
  }
}

async function getHomePage(): Promise<CmsPage | null> {
  const query = `coalesce(*[_type == "homePage" && _id == "homePage"][0], *[_type == "homePage"] | order(_updatedAt desc)[0]) {
    title,
    summary,
    hero {
      badge,
      headline,
      description,
      primaryCtaLabel,
      secondaryCtaLabel,
      trustLine
    },
    valueProps[] {
      title,
      description
    },
    valuePropsSection {
      eyebrow,
      headline
    },
    journeySection {
      eyebrow,
      headline,
      description,
      steps[] {
        title,
        description,
        details
      }
    },
    sections {
      featuredPlansTitle,
      featuredPlansDescription,
      planGroupsTitle,
      planLocationsTitle,
      comparisonTitle,
      comparisonDescription
    },
    locationSection {
      eyebrow,
      headline,
      description,
      footerTitle,
      footerDescription,
      ctaLabel
    },
    testimonialsSection {
      eyebrow,
      headline,
      ratingLabel,
      items[] {
        quote,
        name,
        role
      }
    },
    faqPreviewSection {
      eyebrow,
      headline,
      description,
      ctaLabel,
      items[] {
        question,
        answer
      }
    },
    liveSupportSection {
      eyebrow,
      headline,
      description,
      topics[] {
        title,
        description
      }
    },
    finalCta {
      headline,
      description,
      primaryCtaLabel,
      secondaryCtaLabel
    },
    seoTitle,
    seoDescription
  }`
  const { data } = await sanityFetch({
    query,
    tags: ["sanity", "homePage", "cms:homepage"],
  })
  const document = data as HomePageDocument | null

  if (!document) {
    return null
  }

  return mapHomePageToCms(document)
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSanityConfigured) {
    return fallbackSiteSettings
  }

  try {
    const query = `coalesce(*[_type == "siteSettings" && _id == "siteSettings"][0], *[_type == "siteSettings"] | order(_updatedAt desc)[0]) {
      brandName,
      headerLinks[] {
        label,
        href
      },
      footerLinks[] {
        label,
        href
      },
      footer {
        tagline,
        copyrightText,
        statusText,
        columns[] {
          title,
          links[] {
            label,
            href
          }
        }
      }
    }`
    const { data } = await sanityFetch({
      query,
      tags: ["sanity", "siteSettings", "cms:site-settings"],
    })

    return mapSiteSettings(data as SiteSettingsDocument | null)
  } catch {
    return fallbackSiteSettings
  }
}

async function getFaqPage(): Promise<CmsPage | null> {
  const query = `coalesce(*[_type == "faqPage" && _id == "faqPage"][0], *[_type == "faqPage"] | order(_updatedAt desc)[0]) {
    title,
    summary,
    items[] {
      question,
      answer
    },
    seoTitle,
    seoDescription
  }`
  const { data } = await sanityFetch({
    query,
    tags: ["sanity", "faqPage", "cms:faq"],
  })
  const document = data as FaqPageDocument | null

  if (!document) {
    return null
  }

  return mapFaqPageToCms(document)
}

async function getLegalPage(slug: string): Promise<CmsPage | null> {
  const query = `*[_type == "legalPage" && slug.current == $slug][0] {
    title,
    summary,
    body,
    seoTitle,
    seoDescription
  }`
  const { data } = await sanityFetch({
    query,
    params: { slug },
    tags: ["sanity", "legalPage", `cms:${slug}`],
  })
  const document = data as LegalPageDocument | null

  if (!document) {
    return null
  }

  return mapLegalPageToCms(slug, document)
}

export async function getCmsPage(slug: string): Promise<CmsPage> {
  const fallback = getFallbackPage(slug)

  if (!isSanityConfigured) {
    if (fallback) {
      return fallback
    }

    return {
      slug,
      title: "Content",
      summary: null,
      content: {},
      seoTitle: null,
      seoDescription: null,
    }
  }

  try {
    let page: CmsPage | null = null

    if (slug === "homepage") {
      page = await getHomePage()
    } else if (slug === "faq") {
      page = await getFaqPage()
    } else if (
      ["terms", "privacy", "refund-policy", "contact"].includes(slug)
    ) {
      page = await getLegalPage(slug)
    }

    if (page) {
      return {
        ...(fallback ?? {}),
        ...page,
        content: page.content ?? fallback?.content ?? {},
      }
    }
  } catch {
    // Sanity is optional during rollout. We intentionally fail over to
    // local defaults when API credentials are missing or remote fetch fails.
  }

  if (fallback) {
    return fallback
  }

  return {
    slug,
    title: "Content",
    summary: null,
    content: {},
    seoTitle: null,
    seoDescription: null,
  }
}

export function getFallbackCmsPagesForImport() {
  return [
    fallbackPages.homepage,
    fallbackPages.faq,
    fallbackPages.terms,
    fallbackPages.privacy,
    fallbackPages["refund-policy"],
    fallbackPages.contact,
  ].filter((page): page is CmsPage => Boolean(page))
}
