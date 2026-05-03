import { fallbackPages, fallbackSiteSettings, getFallbackPage } from "@/lib/cms-fallback"
import type {
  CmsPage,
  FaqPageDocument,
  HomePageDocument,
  LegalPageDocument,
  SiteSettings,
  SiteSettingsDocument,
} from "@/lib/cms-types"

export function mapHomePageToCms(document: HomePageDocument): CmsPage {
  return {
    slug: "homepage",
    title: document.title ?? fallbackPages.homepage.title,
    summary: document.summary ?? fallbackPages.homepage.summary,
    content: {
      hero: document.hero ?? fallbackPages.homepage.content.hero,
      valueProps: document.valueProps ?? fallbackPages.homepage.content.valueProps,
      valuePropsSection:
        document.valuePropsSection ?? fallbackPages.homepage.content.valuePropsSection,
      journeySection:
        document.journeySection ?? fallbackPages.homepage.content.journeySection,
      sections: document.sections ?? fallbackPages.homepage.content.sections,
      locationSection:
        document.locationSection ?? fallbackPages.homepage.content.locationSection,
      testimonialsSection:
        document.testimonialsSection ??
        fallbackPages.homepage.content.testimonialsSection,
      faqPreviewSection:
        document.faqPreviewSection ?? fallbackPages.homepage.content.faqPreviewSection,
      liveSupportSection:
        document.liveSupportSection ?? fallbackPages.homepage.content.liveSupportSection,
      finalCta: document.finalCta ?? fallbackPages.homepage.content.finalCta,
    },
    seoTitle: document.seoTitle ?? fallbackPages.homepage.seoTitle,
    seoDescription: document.seoDescription ?? fallbackPages.homepage.seoDescription,
  }
}

export function mapSiteSettings(
  document: SiteSettingsDocument | null
): SiteSettings {
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

export function mapFaqPageToCms(document: FaqPageDocument): CmsPage {
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

export function mapLegalPageToCms(slug: string, document: LegalPageDocument): CmsPage {
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

export function createDefaultCmsPage(slug: string): CmsPage {
  return {
    slug,
    title: "Content",
    summary: null,
    content: {},
    seoTitle: null,
    seoDescription: null,
  }
}
