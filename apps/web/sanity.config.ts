import { defineConfig } from "sanity"
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./sanity/schemaTypes"
import { blogAuthorTypeName } from "./sanity/schemaTypes/blogAuthor"
import { blogCategoryTypeName } from "./sanity/schemaTypes/blogCategory"
import { blogPostTypeName } from "./sanity/schemaTypes/blogPost"
import { blogSettingsTypeName } from "./sanity/schemaTypes/blogSettings"
import { blogTagTypeName } from "./sanity/schemaTypes/blogTag"
import { faqPageTypeName } from "./sanity/schemaTypes/faqPage"
import { homePageTypeName } from "./sanity/schemaTypes/homePage"
import { legalPageTypeName } from "./sanity/schemaTypes/legalPage"
import { siteSettingsTypeName } from "./sanity/schemaTypes/siteSettings"

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  process.env.SANITY_PROJECT_ID ??
  "missing-project-id"
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  "production"
const previewOrigin =
  process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/$/, "") ?? "http://localhost:3000"

export default defineConfig({
  name: "default",
  title: "TrueRDP CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    presentationTool({
      title: "Live Preview",
      previewUrl: {
        initial: previewOrigin,
        previewMode: {
          enable: "/api/draft",
          shareAccess: true,
        },
      },
      allowOrigins: [previewOrigin],
      resolve: {
        mainDocuments: defineDocuments([
          {
            route: "/",
            type: homePageTypeName,
          },
          {
            route: "/",
            type: siteSettingsTypeName,
          },
          {
            route: "/faq",
            type: faqPageTypeName,
          },
          {
            route: "/blog",
            type: blogSettingsTypeName,
          },
          {
            route: "/blog/:slug",
            filter: `_type == "${blogPostTypeName}" && slug.current == $slug`,
            params: ({ params }) => ({ slug: params.slug ?? "" }),
          },
          {
            route: "/:slug",
            filter: `_type == "${legalPageTypeName}" && slug.current == $slug`,
            params: ({ params }) => ({ slug: params.slug ?? "" }),
          },
        ]),
        locations: {
          [homePageTypeName]: defineLocations({
            locations: [{ title: "Homepage", href: "/" }],
          }),
          [siteSettingsTypeName]: defineLocations({
            locations: [{ title: "Global site chrome", href: "/" }],
          }),
          [faqPageTypeName]: defineLocations({
            locations: [{ title: "FAQ", href: "/faq" }],
          }),
          [blogSettingsTypeName]: defineLocations({
            locations: [{ title: "Blog", href: "/blog" }],
          }),
          [blogPostTypeName]: defineLocations({
            select: {
              title: "title",
              slug: "slug.current",
            },
            resolve: (document) => {
              const title = document?.title as string | undefined
              const slug = document?.slug as string | undefined

              if (!slug) {
                return {
                  message: "Add a slug to preview this post.",
                  tone: "caution",
                }
              }

              return {
                locations: [
                  {
                    title: title || "Blog post",
                    href: `/blog/${slug}`,
                  },
                ],
              }
            },
          }),
          [legalPageTypeName]: defineLocations({
            select: {
              title: "title",
              slug: "slug.current",
            },
            resolve: (document) => {
              const title = document?.title as string | undefined
              const slug = document?.slug as string | undefined

              if (!slug) {
                return {
                  message: "Add a slug to preview this page.",
                  tone: "caution",
                }
              }

              return {
                locations: [
                  {
                    title: title || "Page",
                    href: `/${slug}`,
                  },
                ],
              }
            },
          }),
        },
      },
    }),
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site Settings")
              .child(
                S.document()
                  .schemaType(siteSettingsTypeName)
                  .documentId(siteSettingsTypeName)
              ),
            S.divider(),
            S.listItem()
              .title("Blog Settings")
              .child(
                S.document()
                  .schemaType(blogSettingsTypeName)
                  .documentId(blogSettingsTypeName)
              ),
            S.listItem()
              .title("Blog Posts")
              .child(S.documentTypeList(blogPostTypeName)),
            S.listItem()
              .title("Blog Authors")
              .child(S.documentTypeList(blogAuthorTypeName)),
            S.listItem()
              .title("Blog Categories")
              .child(S.documentTypeList(blogCategoryTypeName)),
            S.listItem()
              .title("Blog Tags")
              .child(S.documentTypeList(blogTagTypeName)),
            S.divider(),
            S.listItem()
              .title("Homepage")
              .child(
                S.document()
                  .schemaType(homePageTypeName)
                  .documentId(homePageTypeName)
              ),
            S.listItem()
              .title("FAQ")
              .child(
                S.document()
                  .schemaType(faqPageTypeName)
                  .documentId(faqPageTypeName)
              ),
            S.listItem()
              .title("Legal, Policy, Contact")
              .child(S.documentTypeList(legalPageTypeName)),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
