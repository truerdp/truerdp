import { getSiteOrigin, listBlogPosts } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export async function GET() {
  const { posts } = await listBlogPosts({
    page: 1,
    pageSize: 100,
  })
  const origin = getSiteOrigin()

  const items = posts
    .map((post) => {
      const url = `${origin}${blogPaths.post(post.slug)}`
      const description = xmlEscape(post.excerpt)
      const title = xmlEscape(post.title)
      const author = post.author?.name ? xmlEscape(post.author.name) : "TrueRDP"
      const pubDate = new Date(post.publishAt).toUTCString()
      const contentSnippet = xmlEscape(post.excerpt)

      return `
        <item>
          <title>${title}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${pubDate}</pubDate>
          <author>${author}</author>
          <description>${description}</description>
          <content:encoded><![CDATA[${contentSnippet}]]></content:encoded>
        </item>
      `
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>TrueRDP Blog</title>
      <link>${origin}${blogPaths.index}</link>
      <description>Latest operational and product updates from TrueRDP.</description>
      ${items}
    </channel>
  </rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate=86400",
    },
  })
}
