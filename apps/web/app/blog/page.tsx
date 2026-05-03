import type { Metadata } from "next"
import Link from "next/link"
import {
  BlogPostCard,
  BlogSearchForm,
  BlogTagPill,
} from "@/components/blog/blog-ui"
import { getBlogSettings, getSiteOrigin, listBlogPosts } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

type PageProps = {
  searchParams: Promise<{ page?: string }>
}

const pageSize = 12

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBlogSettings()
  const origin = getSiteOrigin()

  return {
    title: `${settings.heroTitle} | TrueRDP`,
    description: settings.heroDescription,
    alternates: {
      canonical: `${origin}${blogPaths.index}`,
    },
  }
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? "1") || 1)
  const [{ posts, total }, settings] = await Promise.all([
    listBlogPosts({ page, pageSize }),
    getBlogSettings(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          {settings.heroTitle}
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          {settings.heroDescription}
        </p>
        <BlogSearchForm defaultQuery="" />
      </header>

      {posts.length === 0 ? (
        <section className="mt-10 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground">
            No published posts yet.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </section>

          <section className="mt-8 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link
                  href={`${blogPaths.index}?page=${page - 1}`}
                  className="rounded-md border px-3 py-1.5 text-sm"
                >
                  Previous
                </Link>
              ) : null}
              {hasNext ? (
                <Link
                  href={`${blogPaths.index}?page=${page + 1}`}
                  className="rounded-md border px-3 py-1.5 text-sm"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </section>

          <section className="mt-10 space-y-3">
            <h2 className="text-xl font-semibold">Browse topics</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(posts.flatMap((post) => post.categories.map((c) => c.slug)))
              ).map((slug) => (
                <BlogTagPill
                  key={slug}
                  label={slug}
                  href={blogPaths.category(slug)}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}
