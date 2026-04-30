import { defineConfig } from "sanity"
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from "sanity/presentation"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./sanity/schemaTypes"
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
