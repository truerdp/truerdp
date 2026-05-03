import type {
  BlogAuthor,
  BlogCategory,
  BlogImage,
  BlogPost,
  BlogPostDocument,
  BlogPostSummary,
  BlogTag,
} from "@/lib/blog-types"

export function toImage(
  input?: {
    asset?: { url?: string }
  } | null
): BlogImage | null {
  const url = input?.asset?.url?.trim()
  return url ? { url } : null
}

function toAuthor(
  input?: {
    name?: string
    slug?: { current?: string }
    bio?: string
    avatar?: { asset?: { url?: string } }
  } | null
): BlogAuthor | null {
  const name = input?.name?.trim()
  if (!name) {
    return null
  }

  return {
    name,
    slug: input?.slug?.current?.trim() || null,
    bio: input?.bio?.trim() || null,
    avatar: toImage(input?.avatar),
  }
}

function toCategories(input: BlogPostDocument["categories"]): BlogCategory[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      const slug = entry?.slug?.current?.trim()
      const name = entry?.name?.trim()

      if (!entry?._id || !slug || !name) {
        return null
      }

      return {
        id: entry._id,
        name,
        slug,
        description: entry?.description?.trim() || null,
      }
    })
    .filter((entry): entry is BlogCategory => Boolean(entry))
}

function toTags(input: BlogPostDocument["tags"]): BlogTag[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      const slug = entry?.slug?.current?.trim()
      const name = entry?.name?.trim()

      if (!entry?._id || !slug || !name) {
        return null
      }

      return {
        id: entry._id,
        name,
        slug,
      }
    })
    .filter((entry): entry is BlogTag => Boolean(entry))
}

export function portableTextToPlainText(
  blocks: Record<string, unknown>[] | null | undefined
) {
  if (!Array.isArray(blocks)) {
    return ""
  }

  return blocks
    .map((block) => {
      if (!block || typeof block !== "object") {
        return ""
      }

      const children = (block as { children?: unknown }).children
      if (!Array.isArray(children)) {
        return ""
      }

      return children
        .map((child) => {
          if (!child || typeof child !== "object") {
            return ""
          }

          const text = (child as { text?: unknown }).text
          return typeof text === "string" ? text : ""
        })
        .join("")
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export function estimateReadingTimeMinutes(text: string) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  return Math.max(1, Math.ceil(wordCount / 220))
}

export function mapPostSummary(
  document: BlogPostDocument
): BlogPostSummary | null {
  const id = document._id?.trim()
  const title = document.title?.trim()
  const slug = document.slug?.current?.trim()
  const excerpt = document.excerpt?.trim()
  const publishAt = document.publishAt?.trim()

  if (!id || !title || !slug || !excerpt || !publishAt) {
    return null
  }

  const plainText = portableTextToPlainText(document.body ?? [])

  return {
    id,
    title,
    slug,
    excerpt,
    coverImage: toImage(document.coverImage),
    ogImage: toImage(document.ogImage),
    author: toAuthor(document.author),
    categories: toCategories(document.categories),
    tags: toTags(document.tags),
    publishAt,
    isFeatured: Boolean(document.isFeatured),
    readingTimeMinutes: estimateReadingTimeMinutes(plainText),
  }
}

export function mapPost(document: BlogPostDocument): BlogPost | null {
  const summary = mapPostSummary(document)

  if (!summary) {
    return null
  }

  return {
    ...summary,
    body: Array.isArray(document.body) ? document.body : [],
    seoTitle: document.seoTitle?.trim() || null,
    seoDescription: document.seoDescription?.trim() || null,
  }
}
