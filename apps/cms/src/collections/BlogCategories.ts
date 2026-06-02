import type { CollectionConfig } from "payload"

import { editorAccess, revalidateCollection } from "../lib/revalidate"

export const BlogCategories: CollectionConfig = {
  slug: "blog-categories",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Blog",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection("blog-categories")],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
  ],
}
