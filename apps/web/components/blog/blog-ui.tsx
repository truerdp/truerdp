import Link from "next/link"
import { PortableText } from "@portabletext/react"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import type { BlogPostSummary } from "@/lib/blog"
import { blogPaths } from "@/lib/paths"
import { Button } from "@workspace/ui/components/button"

type PortableTextValue = {
  _type: string
} & Record<string, unknown>

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function BlogTagPill({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </Link>
  )
}

export function BlogAuthorByline({
  name,
  publishAt,
  readingTimeMinutes,
}: {
  name: string | null
  publishAt: string
  readingTimeMinutes: number
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {name ? `By ${name} · ` : ""}
      {formatDate(publishAt)} · {readingTimeMinutes} min read
    </p>
  )
}

export function BlogPostCard({ post }: { post: BlogPostSummary }) {
  const category = post.categories[0]
  const coverUrl = post.coverImage?.url

  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      {coverUrl ? (
        <Link href={blogPaths.post(post.slug)} className="block">
          <img
            src={coverUrl}
            alt={post.title}
            className="h-48 w-full object-cover"
          />
        </Link>
      ) : null}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          {category ? <Badge variant="secondary">{category.name}</Badge> : null}
          {post.isFeatured ? <Badge>Featured</Badge> : null}
        </div>
        <h2 className="text-xl leading-tight font-semibold">
          <Link href={blogPaths.post(post.slug)} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">{post.excerpt}</p>
        <BlogAuthorByline
          name={post.author?.name ?? null}
          publishAt={post.publishAt}
          readingTimeMinutes={post.readingTimeMinutes}
        />
      </div>
    </article>
  )
}

export function BlogSearchForm({ defaultQuery }: { defaultQuery: string }) {
  return (
    <form action={blogPaths.search} className="flex w-full gap-2 sm:max-w-2xl">
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Search posts"
      />
      <Button type="submit">Search</Button>
    </form>
  )
}

export function BlogPortableBody({
  value,
}: {
  value: Record<string, unknown>[]
}) {
  const normalizedValue = value.filter(
    (item): item is PortableTextValue =>
      typeof item === "object" &&
      item !== null &&
      typeof item._type === "string"
  )

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <PortableText
        value={normalizedValue}
        components={{
          block: {
            h2: ({ children }) => (
              <h2 className="mt-10 text-2xl font-semibold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-8 text-xl font-semibold">{children}</h3>
            ),
          },
          marks: {
            link: ({ value, children }) => {
              const href =
                typeof value?.href === "string" && value.href ? value.href : "#"
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {children}
                </a>
              )
            },
          },
        }}
      />
    </div>
  )
}

export function RelatedPosts({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) {
    return null
  }

  return (
    <section className="mt-14 space-y-4">
      <h2 className="text-2xl font-semibold">Related posts</h2>
      <div className="grid gap-5 md:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
