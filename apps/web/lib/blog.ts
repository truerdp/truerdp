import "server-only"

import { isSanityConfigured, sanityFetch } from "@/lib/sanity"
import {
  blogSettingsQuery,
  fallbackBlogSettings,
  postProjection,
} from "@/lib/blog-queries"
import {
  mapPost,
  mapPostSummary,
  portableTextToPlainText,
  toImage,
} from "@/lib/blog-mappers"
import type {
  BlogPostDocument,
  BlogPostSummary,
  BlogSettings,
  BlogSettingsDocument,
  ListBlogPostsInput,
} from "@/lib/blog-types"

export async function getBlogSettings(): Promise<BlogSettings> {
  if (!isSanityConfigured) {
    return fallbackBlogSettings
  }

  try {
    const { data } = await sanityFetch({
      query: blogSettingsQuery,
      tags: ["sanity", "blog", "blog:settings"],
    })
    const document = data as BlogSettingsDocument | null

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
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const textQuery = input.query?.trim() || ""
  const categorySlug = input.categorySlug?.trim() || ""
  const tagSlug = input.tagSlug?.trim() || ""

  if (!isSanityConfigured) {
    return { posts: [], total: 0, page, pageSize }
  }

  const params: Record<string, unknown> = {
    start,
    end,
    q: textQuery ? `*${textQuery.replaceAll('"', "")}*` : "",
    categorySlug,
    tagSlug,
  }

  const baseFilter = `_type == "blogPost" && isPublished == true && publishAt <= now()`
  const categoryFilter = `($categorySlug == "" || count(categories[]->slug.current[@ == $categorySlug]) > 0)`
  const tagFilter = `($tagSlug == "" || count(tags[]->slug.current[@ == $tagSlug]) > 0)`
  const searchFilter = `($q == "" || title match $q || excerpt match $q || pt::text(body) match $q)`
  const where = `${baseFilter} && ${categoryFilter} && ${tagFilter} && ${searchFilter}`

  const query = `{
    "total": count(*[${where}]),
    "posts": *[${where}] | order(isFeatured desc, publishAt desc) [$start...$end] ${postProjection}
  }`

  const tags = ["sanity", "blog", "blog:post"]
  if (categorySlug) {
    tags.push(`blog:category:${categorySlug}`)
  }
  if (tagSlug) {
    tags.push(`blog:tag:${tagSlug}`)
  }

  const { data } = await sanityFetch({
    query,
    params,
    tags,
  })

  const result = data as
    | { total?: number; posts?: BlogPostDocument[] }
    | null
    | undefined

  const posts = (result?.posts ?? [])
    .map((document) => mapPostSummary(document))
    .filter((entry): entry is BlogPostSummary => Boolean(entry))

  return {
    posts,
    total: result?.total ?? 0,
    page,
    pageSize,
  }
}

export async function getBlogPostBySlug(slug: string) {
  if (!isSanityConfigured) {
    return null
  }

  const cleanSlug = slug.trim()
  if (!cleanSlug) {
    return null
  }

  const query = `*[_type == "blogPost" && slug.current == $slug && isPublished == true && publishAt <= now()][0] ${postProjection}`
  const { data } = await sanityFetch({
    query,
    params: { slug: cleanSlug },
    tags: ["sanity", "blog", "blog:post", `blog:slug:${cleanSlug}`],
  })
  const document = data as BlogPostDocument | null
  if (!document) {
    return null
  }

  return mapPost(document)
}

export async function getRelatedBlogPosts(input: {
  slug: string
  categorySlugs: string[]
  limit?: number
}) {
  if (!isSanityConfigured) {
    return []
  }

  const limit = Math.max(1, Math.min(12, input.limit ?? 3))
  const categorySlugs = input.categorySlugs.filter(Boolean)

  const query = `*[
    _type == "blogPost" &&
    slug.current != $slug &&
    isPublished == true &&
    publishAt <= now() &&
    (
      count(categories[]->slug.current[@ in $categorySlugs]) > 0 ||
      isFeatured == true
    )
  ] | order(publishAt desc) [0...$limit] ${postProjection}`
  const { data } = await sanityFetch({
    query,
    params: {
      slug: input.slug,
      categorySlugs,
      limit,
    },
    tags: ["sanity", "blog", "blog:post"],
  })

  return (data as BlogPostDocument[] | null | undefined)
    ?.map((document) => mapPostSummary(document))
    .filter((entry): entry is BlogPostSummary => Boolean(entry))
    .slice(0, limit) ?? []
}

export {
  getSiteOrigin,
  listAllPublishedBlogSlugs,
  listBlogCategories,
  listBlogTags,
} from "@/lib/blog-taxonomies"
export { estimateReadingTimeMinutes, portableTextToPlainText }
from "@/lib/blog-mappers"
export type {
  BlogAuthor,
  BlogCategory,
  BlogImage,
  BlogPost,
  BlogPostSummary,
  BlogSettings,
  BlogTag,
} from "@/lib/blog-types"
