import "dotenv/config"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { getPayload } from "payload"

import config from "../../payload.config"

type LegacyPage = {
  slug: string
  title: string
  summary?: string | null
  content?: Record<string, unknown>
  seo_title?: string | null
  seoTitle?: string | null
  seo_description?: string | null
  seoDescription?: string | null
  is_published?: boolean
  isPublished?: boolean
}

type LegacyBackup = {
  cmsPages?: LegacyPage[]
  emailTemplates?: Array<{
    key: string
    subject_template?: string
    subjectTemplate?: string
    html_template?: string
    htmlTemplate?: string
    text_template?: string | null
    textTemplate?: string | null
    is_active?: boolean
    isActive?: boolean
  }>
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null
  }

  return JSON.parse(readFileSync(path, "utf8")) as T
}

function getArg(name: string) {
  const prefix = `--${name}=`
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length)
}

function pickSeo(page: LegacyPage) {
  return {
    seoTitle: page.seoTitle ?? page.seo_title ?? null,
    seoDescription: page.seoDescription ?? page.seo_description ?? null,
  }
}

const legacyPath = getArg("legacy")
const legacy = legacyPath ? readJson<LegacyBackup>(resolve(legacyPath)) : null
const payload = await getPayload({ config })

for (const page of legacy?.cmsPages ?? []) {
  if (!page.is_published && !page.isPublished) {
    continue
  }

  const content = page.content ?? {}
  const seo = pickSeo(page)

  if (page.slug === "homepage") {
    await payload.updateGlobal({
      slug: "home-page",
      data: {
        title: page.title,
        summary: page.summary ?? null,
        ...content,
        ...seo,
      },
    })
    continue
  }

  if (page.slug === "faq") {
    await payload.updateGlobal({
      slug: "faq-page",
      data: {
        title: page.title,
        summary: page.summary ?? null,
        items: Array.isArray(content.items) ? content.items : [],
        ...seo,
      },
    })
    continue
  }

  const existing = await payload.find({
    collection: "legal-pages",
    where: { slug: { equals: page.slug } },
    limit: 1,
    overrideAccess: true,
  })

  const data: Record<string, unknown> = {
    title: page.title,
    slug: page.slug,
    summary: page.summary ?? null,
    body: content.body ?? null,
    ...seo,
    _status: "published" as const,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: "legal-pages",
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    } as never)
  } else {
    await payload.create({
      collection: "legal-pages",
      data,
      overrideAccess: true,
    } as never)
  }
}

for (const template of legacy?.emailTemplates ?? []) {
  const existing = await payload.find({
    collection: "email-templates",
    where: { key: { equals: template.key } },
    limit: 1,
    overrideAccess: true,
  })
  const data = {
    key: template.key,
    subjectTemplate:
      template.subjectTemplate ?? template.subject_template ?? "",
    htmlTemplate: template.htmlTemplate ?? template.html_template ?? "",
    textTemplate: template.textTemplate ?? template.text_template ?? null,
    isActive: template.isActive ?? template.is_active ?? true,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: "email-templates",
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: "email-templates",
      data,
      overrideAccess: true,
    })
  }
}

console.log("Payload import complete")
