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
  body: Record<string, unknown>[]
  seoTitle: string | null
  seoDescription: string | null
}

export type BlogSettings = {
  heroTitle: string
  heroDescription: string
  defaultOgImage: BlogImage | null
}

export type BlogPostDocument = {
  _id?: string
  title?: string
  slug?: { current?: string }
  excerpt?: string
  coverImage?: { asset?: { url?: string } }
  ogImage?: { asset?: { url?: string } }
  author?: {
    name?: string
    slug?: { current?: string }
    bio?: string
    avatar?: { asset?: { url?: string } }
  }
  categories?: Array<{
    _id?: string
    name?: string
    slug?: { current?: string }
    description?: string
  }>
  tags?: Array<{
    _id?: string
    name?: string
    slug?: { current?: string }
  }>
  publishAt?: string
  isFeatured?: boolean
  seoTitle?: string
  seoDescription?: string
  body?: Record<string, unknown>[]
}

export type BlogSettingsDocument = {
  heroTitle?: string
  heroDescription?: string
  defaultOgImage?: { asset?: { url?: string } }
}

export type ListBlogPostsInput = {
  page?: number
  pageSize?: number
  query?: string
  categorySlug?: string
  tagSlug?: string
}
