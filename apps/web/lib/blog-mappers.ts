import type {
  BlogAuthor,
  BlogCategory,
  BlogImage,
  BlogPost,
  BlogTag,
  PayloadAuthorDocument,
  PayloadBlogPostDocument,
  PayloadMediaDocument,
  PayloadTaxonomyDocument,
} from "@/lib/blog-types"

export function toImage(input?: PayloadMediaDocument | string | number | null): BlogImage | null {
  if (!input || typeof input !== "object") {
    return null
  }

  const url = input.url?.trim()
  return url ? { url } : null
}

function toAuthor(input?: PayloadAuthorDocument | string | number | null): BlogAuthor | null {
  if (!input || typeof input !== "object") {
    return null
  }

  const name = input.name?.trim()
  if (!name) {
    return null
  }

  return {
    name,
    slug: input.slug?.trim() || null,
    bio: input.bio?.trim() || null,
    avatar: toImage(input.avatar),
  }
}

function toCategories(input: PayloadBlogPostDocument["categories"]): BlogCategory[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const item = entry as PayloadTaxonomyDocument
      const id = String(item.id ?? "").trim()
      const slug = item.slug?.trim()
      const name = item.name?.trim()

      if (!id || !slug || !name) {
        return null
      }

      return {
        id,
        name,
        slug,
        description: item.description?.trim() || null,
      }
    })
    .filter((entry): entry is BlogCategory => Boolean(entry))
}

function toTags(input: PayloadBlogPostDocument["tags"]): BlogTag[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null
      }

      const item = entry as PayloadTaxonomyDocument
      const id = String(item.id ?? "").trim()
      const slug = item.slug?.trim()
      const name = item.name?.trim()

      if (!id || !slug || !name) {
        return null
      }

      return {
        id,
        name,
        slug,
      }
    })
    .filter((entry): entry is BlogTag => Boolean(entry))
}

function readLexicalText(node: unknown): string {
  if (!node || typeof node !== "object") {
    return ""
  }

  const record = node as Record<string, unknown>
  const text = typeof record.text === "string" ? record.text : ""
  const children = Array.isArray(record.children)
    ? record.children.map(readLexicalText).join(" ")
    : ""

  return `${text} ${children}`.trim()
}

export function lexicalToPlainText(value: unknown) {
  if (!value || typeof value !== "object") {
    return ""
  }

  const root = (value as { root?: unknown }).root
  return readLexicalText(root).replace(/\s+/g, " ").trim()
}

export function estimateReadingTimeMinutes(text: string) {
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  return Math.max(1, Math.ceil(wordCount / 220))
}

export function mapPayloadPost(document: PayloadBlogPostDocument | null | undefined): BlogPost | null {
  const id = String(document?.id ?? "").trim()
  const title = document?.title?.trim()
  const slug = document?.slug?.trim()
  const excerpt = document?.excerpt?.trim()
  const publishAt = document?.publishAt?.trim()

  if (!id || !title || !slug || !excerpt || !publishAt) {
    return null
  }

  const body = document?.body ?? null
  const plainText = lexicalToPlainText(body)

  return {
    id,
    title,
    slug,
    excerpt,
    coverImage: toImage(document?.coverImage),
    ogImage: toImage(document?.ogImage),
    author: toAuthor(document?.author),
    categories: toCategories(document?.categories),
    tags: toTags(document?.tags),
    publishAt,
    isFeatured: Boolean(document?.isFeatured),
    readingTimeMinutes: estimateReadingTimeMinutes(plainText),
    body,
    seoTitle: document?.seoTitle?.trim() || null,
    seoDescription: document?.seoDescription?.trim() || null,
  }
}
