import "server-only"

import { draftMode } from "next/headers"
import {
  fallbackSiteSettings,
  getFallbackCmsPagesForImport,
  getFallbackPage,
} from "@/lib/cms-fallback"
import { createDefaultCmsPage } from "@/lib/cms-page-mappers"
import type { CmsPage, SiteSettings } from "@/lib/cms-types"

type PayloadListResponse<T> = {
  docs?: T[]
  totalDocs?: number
}

type PayloadGlobal = Record<string, unknown>

type PayloadPage = PayloadGlobal & {
  id?: string | number
  title?: string
  slug?: string
  summary?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  body?: unknown
}

function getCmsBaseUrl() {
  return (
    process.env.CMS_INTERNAL_API_URL?.trim() ||
    process.env.PAYLOAD_PUBLIC_URL?.trim() ||
    "http://localhost:3004"
  ).replace(/\/$/, "")
}

async function isDraftModeEnabled() {
  try {
    const draft = await draftMode()
    return draft.isEnabled
  } catch {
    return false
  }
}

async function cmsFetch<T>(path: string): Promise<T | null> {
  const draft = await isDraftModeEnabled()
  const url = new URL(`${getCmsBaseUrl()}${path}`)

  if (!url.searchParams.has("depth")) {
    url.searchParams.set("depth", "2")
  }
  if (draft) {
    url.searchParams.set("draft", "true")
  }

  const headers: HeadersInit = {}
  const token = process.env.CMS_INTERNAL_API_TOKEN?.trim()
  if (draft && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    headers,
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" as const }
      : {
          next: {
            tags: ["cms"],
          },
        }),
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as T
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function mapGlobalToCmsPage(
  slug: string,
  document: PayloadPage | null
): CmsPage | null {
  if (!document) {
    return null
  }

  const fallback = getFallbackPage(slug)
  const content = { ...((fallback?.content as Record<string, unknown>) ?? {}) }

  for (const [key, value] of Object.entries(document)) {
    if (
      [
        "id",
        "createdAt",
        "updatedAt",
        "globalType",
        "title",
        "slug",
        "summary",
        "seoTitle",
        "seoDescription",
      ].includes(key)
    ) {
      continue
    }
    content[key] = value
  }

  if (document.body) {
    content.body = document.body
  }

  return {
    ...(fallback ?? createDefaultCmsPage(slug)),
    slug,
    title: document.title ?? fallback?.title ?? "Content",
    summary: document.summary ?? fallback?.summary ?? null,
    content,
    seoTitle: document.seoTitle ?? null,
    seoDescription: document.seoDescription ?? null,
  }
}

function mapLegalPage(
  slug: string,
  document: PayloadPage | null
): CmsPage | null {
  if (!document) {
    return null
  }

  const fallback = getFallbackPage(slug)

  return {
    ...(fallback ?? createDefaultCmsPage(slug)),
    slug,
    title: document.title ?? fallback?.title ?? "Content",
    summary: document.summary ?? fallback?.summary ?? null,
    content: {
      ...(fallback?.content ?? {}),
      body: document.body ?? fallback?.content.body ?? null,
    },
    seoTitle: document.seoTitle ?? null,
    seoDescription: document.seoDescription ?? null,
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const document = await cmsFetch<PayloadGlobal>("/api/globals/site-settings")

    if (!document) {
      return fallbackSiteSettings
    }

    return {
      brandName:
        toStringOrNull(document.brandName) ?? fallbackSiteSettings.brandName,
      headerLinks: Array.isArray(document.headerLinks)
        ? (document.headerLinks as SiteSettings["headerLinks"])
        : fallbackSiteSettings.headerLinks,
      footerLinks: Array.isArray(document.footerLinks)
        ? (document.footerLinks as SiteSettings["footerLinks"])
        : fallbackSiteSettings.footerLinks,
      footer: {
        ...fallbackSiteSettings.footer,
        ...((document.footer as SiteSettings["footer"] | undefined) ?? {}),
      },
    }
  } catch {
    return fallbackSiteSettings
  }
}

export async function getCmsPage(slug: string): Promise<CmsPage> {
  const fallback = getFallbackPage(slug)

  try {
    if (slug === "homepage") {
      const document = await cmsFetch<PayloadPage>("/api/globals/home-page")
      const page = mapGlobalToCmsPage(slug, document)
      if (page) return page
    }

    if (slug === "faq") {
      const document = await cmsFetch<PayloadPage>("/api/globals/faq-page")
      const page = mapGlobalToCmsPage(slug, document)
      if (page) return page
    }

    const result = await cmsFetch<PayloadListResponse<PayloadPage>>(
      `/api/legal-pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`
    )
    const page = mapLegalPage(slug, result?.docs?.[0] ?? null)
    if (page) return page
  } catch {
    // Payload is optional during local bootstrap; fall back to checked-in defaults.
  }

  return fallback ?? createDefaultCmsPage(slug)
}

export { getFallbackCmsPagesForImport }
export type { CmsPage, PortableTextBlock, SiteSettings } from "@/lib/cms-types"
