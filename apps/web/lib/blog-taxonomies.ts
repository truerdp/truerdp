import "server-only"

import type { BlogCategory, BlogTag, PayloadTaxonomyDocument } from "@/lib/blog-types"

type PayloadListResponse<T> = {
  docs?: T[]
}

function getCmsBaseUrl() {
  return (
    process.env.CMS_INTERNAL_API_URL?.trim() ||
    process.env.PAYLOAD_PUBLIC_URL?.trim() ||
    "http://localhost:3004"
  ).replace(/\/$/, "")
}

async function cmsFetch<T>(path: string): Promise<T | null> {
  const url = new URL(`${getCmsBaseUrl()}${path}`)
  if (!url.searchParams.has("depth")) {
    url.searchParams.set("depth", "1")
  }

  const response = await fetch(url, {
    next: {
      tags: ["cms", "blog"],
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as T
}

function mapCategory(entry: PayloadTaxonomyDocument | null | undefined): BlogCategory | null {
  const id = String(entry?.id ?? "").trim()
  const slug = entry?.slug?.trim()
  const name = entry?.name?.trim()

  if (!id || !slug || !name) {
    return null
  }

  return {
    id,
    slug,
    name,
    description: entry?.description?.trim() || null,
  }
}

function mapTag(entry: PayloadTaxonomyDocument | null | undefined): BlogTag | null {
  const id = String(entry?.id ?? "").trim()
  const slug = entry?.slug?.trim()
  const name = entry?.name?.trim()

  if (!id || !slug || !name) {
    return null
  }

  return { id, slug, name }
}

export async function listBlogCategories() {
  try {
    const result = await cmsFetch<PayloadListResponse<PayloadTaxonomyDocument>>(
      "/api/blog-categories?limit=100&sort=name"
    )

    return result?.docs
      ?.map((entry) => mapCategory(entry))
      .filter((entry): entry is BlogCategory => Boolean(entry)) ?? []
  } catch {
    return []
  }
}

export async function listBlogTags() {
  try {
    const result = await cmsFetch<PayloadListResponse<PayloadTaxonomyDocument>>(
      "/api/blog-tags?limit=100&sort=name"
    )

    return result?.docs
      ?.map((entry) => mapTag(entry))
      .filter((entry): entry is BlogTag => Boolean(entry)) ?? []
  } catch {
    return []
  }
}

export async function listAllPublishedBlogSlugs() {
  try {
    const result = await cmsFetch<PayloadListResponse<{ slug?: string }>>(
      "/api/blog-posts?limit=100&sort=-publishAt"
    )

    return result?.docs
      ?.map((entry) => entry.slug?.trim())
      .filter((entry): entry is string => Boolean(entry)) ?? []
  } catch {
    return []
  }
}

export function getSiteOrigin() {
  const url =
    process.env.NEXT_PUBLIC_WEB_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "http://localhost:3000"

  const candidate = url.startsWith("http") ? url : `https://${url}`

  try {
    return new URL(candidate).origin
  } catch {
    return "http://localhost:3000"
  }
}
