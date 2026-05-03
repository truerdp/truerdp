import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlogPostCard } from "@/components/blog/blog-ui"
import { getSiteOrigin, listBlogPosts, listBlogTags } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tags = await listBlogTags()
  const tag = tags.find((entry) => entry.slug === slug)
  const origin = getSiteOrigin()

  if (!tag) {
    return {
      title: "Tag not found | TrueRDP",
      description: "The requested blog tag is unavailable.",
    }
  }

  return {
    title: `#${tag.name} | TrueRDP Blog`,
    description: `Articles tagged ${tag.name} on the TrueRDP blog.`,
    alternates: {
      canonical: `${origin}${blogPaths.tag(tag.slug)}`,
    },
  }
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params
  const tags = await listBlogTags()
  const tag = tags.find((entry) => entry.slug === slug)

  if (!tag) {
    notFound()
  }

  const { posts } = await listBlogPosts({
    page: 1,
    pageSize: 60,
    tagSlug: slug,
  })
  const origin = getSiteOrigin()
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Blog",
        item: `${origin}${blogPaths.index}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `#${tag.name}`,
        item: `${origin}${blogPaths.tag(tag.slug)}`,
      },
    ],
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <header className="space-y-3">
        <Link href={blogPaths.index} className="text-sm text-muted-foreground">
          Back to blog
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">#{tag.name}</h1>
      </header>

      {posts.length === 0 ? (
        <section className="mt-10 rounded-xl border p-6 text-sm text-muted-foreground">
          No posts with this tag yet.
        </section>
      ) : (
        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </section>
      )}
    </main>
  )
}
