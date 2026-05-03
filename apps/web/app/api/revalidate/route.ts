import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { parseBody } from "next-sanity/webhook"

type SanityWebhookBody = {
  _type?: string
  slug?: {
    current?: string
  }
}

function resolvePathForSlug(input: {
  slug?: string | null
  type?: string | null
}) {
  const slug = input.slug
  if (!slug) {
    return null
  }

  if (input.type === "blogPost") {
    return `/blog/${slug}`
  }

  if (input.type === "blogCategory") {
    return `/blog/category/${slug}`
  }

  if (input.type === "blogTag") {
    return `/blog/tag/${slug}`
  }

  if (slug === "homepage") {
    return "/"
  }

  if (slug === "faq") {
    return "/faq"
  }

  if (slug === "terms") {
    return "/terms"
  }

  if (slug === "privacy") {
    return "/privacy"
  }

  if (slug === "refund-policy") {
    return "/refund-policy"
  }

  if (slug === "contact") {
    return "/contact"
  }

  return null
}

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: "SANITY_REVALIDATE_SECRET is not configured" },
      { status: 500 }
    )
  }

  const { isValidSignature, body } = await parseBody<SanityWebhookBody>(
    request,
    secret
  )

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const typeTag = body?._type
  const slug = body?.slug?.current

  revalidateTag("sanity", "max")

  if (typeTag) {
    revalidateTag(typeTag, "max")
  }

  if (slug) {
    revalidateTag(`cms:${slug}`, "max")
  }

  if (typeTag === "blogPost") {
    revalidateTag("blog", "max")
    revalidateTag("blog:post", "max")
    if (slug) {
      revalidateTag(`blog:slug:${slug}`, "max")
    }
    revalidatePath("/blog")
    revalidatePath("/blog/search")
  }

  if (typeTag === "blogCategory") {
    revalidateTag("blog", "max")
    revalidateTag("blog:category", "max")
    if (slug) {
      revalidateTag(`blog:category:${slug}`, "max")
    }
    revalidatePath("/blog")
    revalidatePath("/blog/search")
  }

  if (typeTag === "blogTag") {
    revalidateTag("blog", "max")
    revalidateTag("blog:tag", "max")
    if (slug) {
      revalidateTag(`blog:tag:${slug}`, "max")
    }
    revalidatePath("/blog")
    revalidatePath("/blog/search")
  }

  if (typeTag === "blogSettings") {
    revalidateTag("blog", "max")
    revalidateTag("blog:settings", "max")
    revalidatePath("/blog")
    revalidatePath("/blog/search")
  }

  const path = resolvePathForSlug({ slug: slug ?? null, type: typeTag ?? null })

  if (path) {
    revalidatePath(path)
  }

  return NextResponse.json({
    revalidated: true,
    path,
    typeTag: typeTag ?? null,
    slug: slug ?? null,
  })
}
