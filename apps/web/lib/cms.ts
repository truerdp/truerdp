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
      },
      sections: {
        planGroupsTitle: "Plans by Type",
        planLocationsTitle: "Plans by Location",
        comparisonTitle: "Plan comparison",
        comparisonDescription:
          "Use this matrix to compare plan resources and locations before checkout.",
      },
      footerLinks: [
        { label: "FAQ", href: "/faq" },
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
        { label: "Refund Policy", href: "/refund-policy" },
        { label: "Contact & Support", href: "/contact" },
      ],
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
  }
  sections?: {
    planGroupsTitle?: string
    planLocationsTitle?: string
    comparisonTitle?: string
    comparisonDescription?: string
  }
  footerLinks?: Array<{
    label?: string
    href?: string
  }>
  seoTitle?: string | null
  seoDescription?: string | null
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
      sections: document.sections ?? fallbackPages.homepage.content.sections,
      footerLinks:
        document.footerLinks ?? fallbackPages.homepage.content.footerLinks,
    },
    seoTitle: document.seoTitle ?? fallbackPages.homepage.seoTitle,
    seoDescription:
      document.seoDescription ?? fallbackPages.homepage.seoDescription,
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
      description
    },
    sections {
      planGroupsTitle,
      planLocationsTitle,
      comparisonTitle,
      comparisonDescription
    },
    footerLinks[] {
      label,
      href
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
