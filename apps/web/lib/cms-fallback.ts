import type { CmsPage, CmsPageSlug } from "@/lib/cms-types"
import { fallbackFaqPage } from "@/lib/cms-fallback/faq"
import { fallbackHomepagePage } from "@/lib/cms-fallback/homepage"
import {
  fallbackPrivacyPage,
  fallbackTermsPage,
} from "@/lib/cms-fallback/legal-core"
import {
  fallbackContactPage,
  fallbackRefundPolicyPage,
} from "@/lib/cms-fallback/legal-support"
import { fallbackSiteSettings } from "@/lib/cms-fallback/site-settings"

const fallbackPages: Record<CmsPageSlug, CmsPage> = {
  homepage: fallbackHomepagePage,
  faq: fallbackFaqPage,
  terms: fallbackTermsPage,
  privacy: fallbackPrivacyPage,
  "refund-policy": fallbackRefundPolicyPage,
  contact: fallbackContactPage,
}

function getFallbackPage(slug: string): CmsPage | null {
  const page = (fallbackPages as Record<string, CmsPage | undefined>)[slug]
  return page ?? null
}

function getFallbackCmsPagesForImport() {
  return [
    fallbackPages.homepage,
    fallbackPages.faq,
    fallbackPages.terms,
    fallbackPages.privacy,
    fallbackPages["refund-policy"],
    fallbackPages.contact,
  ].filter((page): page is CmsPage => Boolean(page))
}

export {
  fallbackPages,
  fallbackSiteSettings,
  getFallbackCmsPagesForImport,
  getFallbackPage,
}
