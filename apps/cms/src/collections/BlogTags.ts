import type { CollectionConfig } from "payload"

import { editorAccess, revalidateCollection } from "../lib/revalidate"

export const BlogTags: CollectionConfig = {
  slug: "blog-tags",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Blog",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection("blog-tags")],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
  ],
}
