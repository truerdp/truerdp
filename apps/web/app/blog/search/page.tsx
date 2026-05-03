import type { Metadata } from "next"
import Link from "next/link"
import { BlogPostCard, BlogSearchForm } from "@/components/blog/blog-ui"
import { getSiteOrigin, listBlogPosts } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

type PageProps = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const q = params.q?.trim() || ""
  const origin = getSiteOrigin()
  const canonical = `${origin}${blogPaths.search}${q ? `?q=${encodeURIComponent(q)}` : ""}`

  return {
    title: q ? `Search: ${q} | TrueRDP Blog` : "Search | TrueRDP Blog",
    description: q
      ? `Search results for "${q}" on the TrueRDP blog.`
      : "Search articles on the TrueRDP blog.",
    alternates: {
      canonical,
    },
  }
}

export default async function BlogSearchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const q = params.q?.trim() || ""
  const { posts } = await listBlogPosts({
    page: 1,
    pageSize: 50,
    query: q || undefined,
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="space-y-4">
        <Link href={blogPaths.index} className="text-sm text-muted-foreground">
          Back to blog
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">Search blog</h1>
        <BlogSearchForm defaultQuery={q} />
      </header>

      {q ? (
        <p className="mt-5 text-sm text-muted-foreground">
          {posts.length} result{posts.length === 1 ? "" : "s"} for &quot;{q}
          &quot;
        </p>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          Enter a keyword to search published posts.
        </p>
      )}

      {q && posts.length === 0 ? (
        <section className="mt-10 rounded-xl border p-6 text-sm text-muted-foreground">
          No posts matched your query.
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </section>
      ) : null}
    </main>
  )
}
