import "server-only"

import { isSanityConfigured, sanityFetch } from "@/lib/sanity"

type BlogCategoryDocument = {
  _id?: string
  name?: string
  slug?: { current?: string }
  description?: string
}

type BlogTagDocument = {
  _id?: string
  name?: string
  slug?: { current?: string }
}

export async function listBlogCategories() {
  if (!isSanityConfigured) {
    return []
  }

  const query = `*[_type == "blogCategory"] | order(name asc) {
    _id,
    name,
    slug,
    description
  }`

  const { data } = await sanityFetch({
    query,
    tags: ["sanity", "blog", "blog:category"],
  })

  return (data as BlogCategoryDocument[] | null | undefined)
    ?.map((entry) => {
      const slug = entry?.slug?.current?.trim()
      const name = entry?.name?.trim()

      if (!entry?._id || !slug || !name) {
        return null
      }

      return {
        id: entry._id,
        slug,
        name,
        description: entry?.description?.trim() || null,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)) ?? []
}

export async function listBlogTags() {
  if (!isSanityConfigured) {
    return []
  }

  const query = `*[_type == "blogTag"] | order(name asc) {
    _id,
    name,
    slug
  }`
  const { data } = await sanityFetch({
    query,
    tags: ["sanity", "blog", "blog:tag"],
  })

  return (data as BlogTagDocument[] | null | undefined)
    ?.map((entry) => {
      const slug = entry?.slug?.current?.trim()
      const name = entry?.name?.trim()

      if (!entry?._id || !slug || !name) {
        return null
      }

      return {
        id: entry._id,
        slug,
        name,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)) ?? []
}

export async function listAllPublishedBlogSlugs() {
  if (!isSanityConfigured) {
    return []
  }

  const query = `*[_type == "blogPost" && isPublished == true && publishAt <= now() && defined(slug.current)] | order(publishAt desc) {
    "slug": slug.current
  }`
  const { data } = await sanityFetch({
    query,
    tags: ["sanity", "blog", "blog:post"],
  })

  return (data as Array<{ slug?: string }> | null | undefined)
    ?.map((entry) => entry.slug?.trim())
    .filter((entry): entry is string => Boolean(entry)) ?? []
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
