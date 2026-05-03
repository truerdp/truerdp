import type { MetadataRoute } from "next"
import { getSiteOrigin } from "@/lib/blog"

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin()

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
