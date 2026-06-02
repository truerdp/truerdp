import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
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

export default buildConfig({
  admin: {
    user: Users.slug,
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
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
    schemaName: "payload",
  }),
  sharp,
})

