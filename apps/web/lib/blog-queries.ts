import type { BlogSettings } from "@/lib/blog-types"

export const fallbackBlogSettings: BlogSettings = {
  heroTitle: "TrueRDP Blog",
  heroDescription:
    "Operational guides, product updates, and practical RDP knowledge from the TrueRDP team.",
  defaultOgImage: null,
}

export const postProjection = `{
  _id,
  title,
  slug,
  excerpt,
  coverImage {
    asset->{
      url
    }
  },
  ogImage {
    asset->{
      url
    }
  },
  author->{
    name,
    slug,
    bio,
    avatar {
      asset->{
        url
      }
    }
  },
  categories[]->{
    _id,
    name,
    slug,
    description
  },
  tags[]->{
    _id,
    name,
    slug
  },
  publishAt,
  isFeatured,
  seoTitle,
  seoDescription,
  body
}`

export const blogSettingsQuery = `coalesce(*[_type == "blogSettings" && _id == "blogSettings"][0], *[_type == "blogSettings"] | order(_updatedAt desc)[0]) {
  heroTitle,
  heroDescription,
  defaultOgImage {
    asset->{
      url
    }
  }
}`
