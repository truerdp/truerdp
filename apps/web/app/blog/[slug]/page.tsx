import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlogAuthorByline, BlogPortableBody, BlogTagPill, RelatedPosts } from "@/components/blog/blog-ui"
import { getBlogPostBySlug, getBlogSettings, getRelatedBlogPosts, getSiteOrigin, portableTextToPlainText } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const [post, settings] = await Promise.all([
    getBlogPostBySlug(slug),
    getBlogSettings(),
  ])

  if (!post) {
    return {
      title: "Post not found | TrueRDP",
      description: "The requested blog post is unavailable.",
    }
  }

  const origin = getSiteOrigin()
  const canonical = `${origin}${blogPaths.post(post.slug)}`
  const ogImage =
    post.ogImage?.url || post.coverImage?.url || settings.defaultOgImage?.url

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: { canonical },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      type: "article",
      publishedTime: post.publishAt,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedBlogPosts({
    slug: post.slug,
    categorySlugs: post.categories.map((category) => category.slug),
    limit: 3,
  })
  const origin = getSiteOrigin()
  const canonical = `${origin}${blogPaths.post(post.slug)}`
  const ogImage = post.ogImage?.url || post.coverImage?.url || undefined

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishAt,
    dateModified: post.publishAt,
    mainEntityOfPage: canonical,
    image: ogImage ? [ogImage] : undefined,
    author: post.author?.name
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "TrueRDP",
    },
  }

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
        name: post.title,
        item: canonical,
      },
    ],
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogPostingJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />

      <header className="space-y-5">
        <Link href={blogPaths.index} className="text-sm text-muted-foreground">
          Back to blog
        </Link>
        <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
        <BlogAuthorByline
          name={post.author?.name ?? null}
          publishAt={post.publishAt}
          readingTimeMinutes={post.readingTimeMinutes}
        />
        {post.coverImage?.url ? (
          <img
            src={post.coverImage.url}
            alt={post.title}
            className="w-full rounded-xl border object-cover"
          />
        ) : null}
      </header>

      <section className="mt-8">
        <BlogPortableBody value={post.body} />
      </section>

      <section className="mt-10 space-y-3 border-t pt-6">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <BlogTagPill
              key={category.id}
              label={category.name}
              href={blogPaths.category(category.slug)}
            />
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-semibold">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <BlogTagPill
              key={tag.id}
              label={tag.name}
              href={blogPaths.tag(tag.slug)}
            />
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Share</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {portableTextToPlainText(post.body).slice(0, 160)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-3 py-1.5"
          >
            Share on X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border px-3 py-1.5"
          >
            Share on LinkedIn
          </a>
        </div>
      </section>

      <RelatedPosts
        posts={relatedPosts.filter((item) => item.slug !== post.slug)}
      />
    </main>
  )
}
