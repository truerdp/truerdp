import type { MetadataRoute } from "next"
import {
  getSiteOrigin,
  listAllPublishedBlogSlugs,
  listBlogCategories,
  listBlogTags,
} from "@/lib/blog"
import { blogPaths, webPaths } from "@/lib/paths"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${origin}${webPaths.home}`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${origin}${webPaths.plans}`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${origin}${webPaths.faq}`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${origin}${webPaths.contact}`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${origin}${webPaths.terms}`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${origin}${webPaths.privacy}`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${origin}${webPaths.refundPolicy}`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${origin}${blogPaths.index}`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${origin}${blogPaths.search}`,
      changeFrequency: "weekly",
      priority: 0.2,
    },
  ]

  const [blogSlugs, categories, tags] = await Promise.all([
    listAllPublishedBlogSlugs(),
    listBlogCategories(),
    listBlogTags(),
  ])

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${origin}${blogPaths.post(slug)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${origin}${blogPaths.category(category.slug)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${origin}${blogPaths.tag(tag.slug)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }))

  return [...staticPages, ...blogPages, ...categoryPages, ...tagPages]
}
