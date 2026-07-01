import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { s3Storage } from "@payloadcms/storage-s3"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildConfig } from "payload"
import sharp from "sharp"

import { BlogAuthors } from "./src/collections/BlogAuthors"
import { BlogCategories } from "./src/collections/BlogCategories"
import { BlogPosts } from "./src/collections/BlogPosts"
import { BlogTags } from "./src/collections/BlogTags"
import { EmailTemplates } from "./src/collections/EmailTemplates"
import { LegalPages } from "./src/collections/LegalPages"
import { Media } from "./src/collections/Media"
import { Users } from "./src/collections/Users"
import { BlogSettings } from "./src/globals/BlogSettings"
import { FaqPage } from "./src/globals/FaqPage"
import { HomePage } from "./src/globals/HomePage"
import { SiteSettings } from "./src/globals/SiteSettings"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const publicUrl = process.env.PAYLOAD_PUBLIC_URL ?? "http://localhost:3004"
const webUrl = process.env.WEB_BASE_URL ?? "http://localhost:3000"
const r2AccountId = process.env.R2_ACCOUNT_ID?.trim() ?? ""
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID?.trim() ?? ""
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim() ?? ""
const r2Bucket = process.env.R2_BUCKET?.trim() ?? ""
const r2Endpoint =
  process.env.R2_ENDPOINT?.trim() ||
  (r2AccountId
    ? `https://${r2AccountId}.r2.cloudflarestorage.com`
    : "")
const shouldUseR2 = process.env.NODE_ENV === "production"
const hasAnyR2Config = [
  r2AccountId,
  r2AccessKeyId,
  r2SecretAccessKey,
  r2Bucket,
  process.env.R2_ENDPOINT?.trim() ?? "",
].some(Boolean)
const isR2Configured = [
  r2Endpoint,
  r2AccessKeyId,
  r2SecretAccessKey,
  r2Bucket,
].every(Boolean)

if (shouldUseR2 && hasAnyR2Config && !isR2Configured) {
  throw new Error(
    "R2 config is incomplete. Set R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and either R2_ENDPOINT or R2_ACCOUNT_ID."
  )
}

export default buildConfig({
  admin: {
    user: Users.slug,
    suppressHydrationWarning: true,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    livePreview: {
      url: ({ data, collectionConfig, globalConfig }) => {
        if (collectionConfig?.slug === "blog-posts" && data?.slug) {
          return `${webUrl}/blog/${data.slug}`
        }

        if (collectionConfig?.slug === "legal-pages" && data?.slug) {
          return `${webUrl}/${data.slug}`
        }

        if (globalConfig?.slug === "faq-page") {
          return `${webUrl}/faq`
        }

        if (globalConfig?.slug === "home-page") {
          return webUrl
        }

        return webUrl
      },
      collections: ["blog-posts", "legal-pages"],
      globals: ["home-page", "faq-page", "site-settings", "blog-settings"],
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 390, height: 844 },
        { label: "Desktop", name: "desktop", width: 1440, height: 1000 },
      ],
    },
  },
  collections: [
    Users,
    Media,
    LegalPages,
    BlogAuthors,
    BlogCategories,
    BlogTags,
    BlogPosts,
    EmailTemplates,
  ],
  globals: [SiteSettings, BlogSettings, HomePage, FaqPage],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL: publicUrl,
  cors: [publicUrl, webUrl].filter(Boolean),
  csrf: [publicUrl, webUrl].filter(Boolean),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  plugins: shouldUseR2 && isR2Configured
    ? [
        s3Storage({
          bucket: r2Bucket,
          config: {
            credentials: {
              accessKeyId: r2AccessKeyId,
              secretAccessKey: r2SecretAccessKey,
            },
            endpoint: r2Endpoint,
            region: "auto",
          },
          clientUploads: true,
          collections: {
            media: true,
          },
        }),
      ]
    : [],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    schemaName: "payload",
  }),
  sharp,
})
