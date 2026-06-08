import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

type PayloadRevalidateBody = {
  collection?: string
  global?: string
  slug?: string | null
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CMS_REVALIDATE_SECRET?.trim()
  const header = request.headers.get("authorization") ?? ""

  return Boolean(secret && header === `Bearer ${secret}`)
}

function resolvePath(input: PayloadRevalidateBody) {
  const slug = input.slug?.trim()

  if (input.global === "home-page") return "/"
  if (input.global === "faq-page") return "/faq"
  if (input.collection === "blog-posts" && slug) return `/blog/${slug}`
  if (input.collection === "blog-categories" && slug)
    return `/blog/category/${slug}`
  if (input.collection === "blog-tags" && slug) return `/blog/tag/${slug}`
  if (input.collection === "legal-pages" && slug) return `/${slug}`

  return null
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = (await request
    .json()
    .catch(() => null)) as PayloadRevalidateBody | null
  const path = body ? resolvePath(body) : null

  revalidateTag("cms", "max")

  if (body?.global) {
    revalidateTag(body.global, "max")
  }
  if (body?.collection) {
    revalidateTag(body.collection, "max")
  }
  if (body?.slug) {
    revalidateTag(`cms:${body.slug}`, "max")
  }

  if (
    body?.collection?.startsWith("blog-") ||
    body?.global === "blog-settings"
  ) {
    revalidateTag("blog", "max")
    revalidatePath("/blog")
    revalidatePath("/blog/search")
  }

  if (path) {
    revalidatePath(path)
  }

  return NextResponse.json({ revalidated: true, path, body })
}
