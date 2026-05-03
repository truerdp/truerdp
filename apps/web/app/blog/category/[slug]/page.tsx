import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlogPostCard } from "@/components/blog/blog-ui"
import {
  getSiteOrigin,
  listBlogCategories,
  listBlogPosts,
} from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const categories = await listBlogCategories()
  const category = categories.find((entry) => entry.slug === slug)
  const origin = getSiteOrigin()

  if (!category) {
    return {
      title: "Category not found | TrueRDP",
      description: "The requested blog category is unavailable.",
    }
  }

  return {
    title: `${category.name} | TrueRDP Blog`,
    description:
      category.description ||
      `Articles in the ${category.name} category on the TrueRDP blog.`,
    alternates: {
      canonical: `${origin}${blogPaths.category(category.slug)}`,
    },
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params
  const categories = await listBlogCategories()
  const category = categories.find((entry) => entry.slug === slug)

  if (!category) {
    notFound()
  }

  const { posts } = await listBlogPosts({
    page: 1,
    pageSize: 60,
    categorySlug: slug,
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
        name: category.name,
        item: `${origin}${blogPaths.category(category.slug)}`,
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
        <h1 className="text-4xl font-semibold tracking-tight">{category.name}</h1>
        {category.description ? (
          <p className="text-muted-foreground">{category.description}</p>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <section className="mt-10 rounded-xl border p-6 text-sm text-muted-foreground">
          No posts in this category yet.
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
