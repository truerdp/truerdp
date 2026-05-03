import { isSanityConfigured, sanityFetch } from "@/lib/sanity"
import {
  faqPageQuery,
  homePageQuery,
  legalPageQuery,
  siteSettingsQuery,
} from "@/lib/cms-queries"
import {
  fallbackPages,
  fallbackSiteSettings,
  getFallbackCmsPagesForImport,
  getFallbackPage,
} from "@/lib/cms-fallback"
import {
  createDefaultCmsPage,
  mapFaqPageToCms,
  mapHomePageToCms,
  mapLegalPageToCms,
  mapSiteSettings,
} from "@/lib/cms-page-mappers"
import type {
  CmsPage,
  FaqPageDocument,
  HomePageDocument,
  LegalPageDocument,
  SiteSettings,
  SiteSettingsDocument,
} from "@/lib/cms-types"

async function getHomePage(): Promise<CmsPage | null> {
  const { data } = await sanityFetch({
    query: homePageQuery,
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
    const { data } = await sanityFetch({
      query: siteSettingsQuery,
      tags: ["sanity", "siteSettings", "cms:site-settings"],
    })

    return mapSiteSettings(data as SiteSettingsDocument | null)
  } catch {
    return fallbackSiteSettings
  }
}

async function getFaqPage(): Promise<CmsPage | null> {
  const { data } = await sanityFetch({
    query: faqPageQuery,
    tags: ["sanity", "faqPage", "cms:faq"],
  })
  const document = data as FaqPageDocument | null

  if (!document) {
    return null
  }

  return mapFaqPageToCms(document)
}

async function getLegalPage(slug: string): Promise<CmsPage | null> {
  const { data } = await sanityFetch({
    query: legalPageQuery,
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

    return createDefaultCmsPage(slug)
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

  return createDefaultCmsPage(slug)
}

export { getFallbackCmsPagesForImport }
export type { CmsPage, PortableTextBlock, SiteSettings } from "@/lib/cms-types"
