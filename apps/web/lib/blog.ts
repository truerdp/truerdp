import "server-only"

import { draftMode } from "next/headers"
import { fallbackBlogSettings } from "@/lib/blog-queries"
import {
  estimateReadingTimeMinutes,
  lexicalToPlainText,
  mapPayloadPost,
  toImage,
} from "@/lib/blog-mappers"
import type {
  BlogPost,
  BlogPostSummary,
  BlogSettings,
  ListBlogPostsInput,
  PayloadBlogPostDocument,
  PayloadBlogSettingsDocument,
} from "@/lib/blog-types"

type PayloadListResponse<T> = {
  docs?: T[]
  totalDocs?: number
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
    next: {
      tags: ["cms", "blog"],
    },
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as T
}

function normalizeQuery(value: string | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function postMatches(input: {
  post: BlogPostSummary
  query: string
  categorySlug: string
  tagSlug: string
}) {
  if (
    input.categorySlug &&
    !input.post.categories.some(
      (category) => category.slug === input.categorySlug
    )
  ) {
    return false
  }

  if (
    input.tagSlug &&
    !input.post.tags.some((tag) => tag.slug === input.tagSlug)
  ) {
    return false
  }

  if (!input.query) {
    return true
  }

  const haystack = [
    input.post.title,
    input.post.excerpt,
    input.post.author?.name ?? "",
    ...input.post.categories.map((category) => category.name),
    ...input.post.tags.map((tag) => tag.name),
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(input.query)
}

export async function getBlogSettings(): Promise<BlogSettings> {
  try {
    const document = await cmsFetch<PayloadBlogSettingsDocument>(
      "/api/globals/blog-settings"
    )

    if (!document) {
      return fallbackBlogSettings
    }

    return {
      heroTitle: document.heroTitle?.trim() || fallbackBlogSettings.heroTitle,
      heroDescription:
        document.heroDescription?.trim() ||
        fallbackBlogSettings.heroDescription,
      defaultOgImage: toImage(document.defaultOgImage),
    }
  } catch {
    return fallbackBlogSettings
  }
}

export async function listBlogPosts(input: ListBlogPostsInput = {}) {
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, input.pageSize ?? 12))
  const query = normalizeQuery(input.query)
  const categorySlug = normalizeQuery(input.categorySlug)
  const tagSlug = normalizeQuery(input.tagSlug)

  try {
    const result = await cmsFetch<PayloadListResponse<PayloadBlogPostDocument>>(
      "/api/blog-posts?limit=100&sort=-isFeatured,-publishAt"
    )

    const allPosts =
      result?.docs
        ?.map((document) => mapPayloadPost(document))
        .filter((post): post is BlogPost => Boolean(post)) ?? []

    const posts = allPosts.filter((post) =>
      postMatches({ post, query, categorySlug, tagSlug })
    )
    const start = (page - 1) * pageSize

    return {
      posts: posts.slice(start, start + pageSize),
      total: posts.length,
      page,
      pageSize,
    }
  } catch {
    return { posts: [], total: 0, page, pageSize }
  }
}

export async function getBlogPostBySlug(slug: string) {
  const cleanSlug = slug.trim()
  if (!cleanSlug) {
    return null
  }

  try {
    const result = await cmsFetch<PayloadListResponse<PayloadBlogPostDocument>>(
      `/api/blog-posts?where[slug][equals]=${encodeURIComponent(cleanSlug)}&limit=1`
    )

    return mapPayloadPost(result?.docs?.[0] ?? null)
  } catch {
    return null
  }
}

export async function getRelatedBlogPosts(input: {
  slug: string
  categorySlugs: string[]
  limit?: number
}) {
  const limit = Math.max(1, Math.min(12, input.limit ?? 3))
  const { posts } = await listBlogPosts({ page: 1, pageSize: 50 })
  const categorySlugs = new Set(input.categorySlugs)

  return posts
    .filter((post) => post.slug !== input.slug)
    .filter(
      (post) =>
        post.isFeatured ||
        post.categories.some((category) => categorySlugs.has(category.slug))
    )
    .slice(0, limit)
}

export {
  getSiteOrigin,
  listAllPublishedBlogSlugs,
  listBlogCategories,
  listBlogTags,
} from "@/lib/blog-taxonomies"
export {
  estimateReadingTimeMinutes,
  lexicalToPlainText as portableTextToPlainText,
}
export type {
  BlogAuthor,
  BlogCategory,
  BlogImage,
  BlogPost,
  BlogPostSummary,
  BlogSettings,
  BlogTag,
} from "@/lib/blog-types"
