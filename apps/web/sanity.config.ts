import { defineConfig } from "sanity"
import { structureTool } from "sanity/structure"
import { visionTool } from "@sanity/vision"
import { schemaTypes } from "./sanity/schemaTypes"
import { faqPageTypeName } from "./sanity/schemaTypes/faqPage"
import { homePageTypeName } from "./sanity/schemaTypes/homePage"
import { legalPageTypeName } from "./sanity/schemaTypes/legalPage"

const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
  process.env.SANITY_PROJECT_ID ??
  "missing-project-id"
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  "production"

export default defineConfig({
  name: "default",
  title: "TrueRDP CMS",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
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
