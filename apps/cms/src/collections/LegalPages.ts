import type { CollectionConfig } from "payload"

import { editorAccess, revalidateCollection } from "../lib/revalidate"
import { seoFields } from "../fields"

export const LegalPages: CollectionConfig = {
  slug: "legal-pages",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Website",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    afterChange: [revalidateCollection("legal-pages")],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "summary",
      type: "textarea",
      maxLength: 500,
    },
    {
      name: "body",
      type: "richText",
    },
    ...seoFields,
  ],
}
