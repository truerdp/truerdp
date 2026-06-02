export type BlogImage = {
  url: string | null
}

export type BlogAuthor = {
  name: string
  slug: string | null
  bio: string | null
  avatar: BlogImage | null
}

export type BlogCategory = {
  id: string
  name: string
  slug: string
  description: string | null
}

export type BlogTag = {
  id: string
  name: string
  slug: string
}

export type BlogPostSummary = {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: BlogImage | null
  ogImage: BlogImage | null
  author: BlogAuthor | null
  categories: BlogCategory[]
  tags: BlogTag[]
  publishAt: string
  isFeatured: boolean
  readingTimeMinutes: number
}

export type BlogPost = BlogPostSummary & {
  body: Record<string, unknown> | null
  seoTitle: string | null
  seoDescription: string | null
}

export type BlogSettings = {
  heroTitle: string
  heroDescription: string
  defaultOgImage: BlogImage | null
}

export type PayloadMediaDocument = {
  id?: string | number
  url?: string
  filename?: string
  alt?: string
}

export type PayloadTaxonomyDocument = {
  id?: string | number
  name?: string
  slug?: string
  description?: string
}

export type PayloadAuthorDocument = PayloadTaxonomyDocument & {
  bio?: string
  avatar?: PayloadMediaDocument | string | number | null
}

export type PayloadBlogPostDocument = {
  id?: string | number
  title?: string
  slug?: string
  excerpt?: string
  coverImage?: PayloadMediaDocument | string | number | null
  ogImage?: PayloadMediaDocument | string | number | null
  author?: PayloadAuthorDocument | string | number | null
  categories?: Array<PayloadTaxonomyDocument | string | number>
  tags?: Array<PayloadTaxonomyDocument | string | number>
  publishAt?: string
  isFeatured?: boolean
  seoTitle?: string
  seoDescription?: string
  body?: Record<string, unknown> | null
}

export type PayloadBlogSettingsDocument = {
  heroTitle?: string
  heroDescription?: string
  defaultOgImage?: PayloadMediaDocument | string | number | null
}

export type ListBlogPostsInput = {
  page?: number
  pageSize?: number
  query?: string
  categorySlug?: string
  tagSlug?: string
}
