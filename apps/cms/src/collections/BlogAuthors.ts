import type { CollectionConfig } from "payload"

import { editorAccess, revalidateCollection } from "../lib/revalidate"

export const BlogAuthors: CollectionConfig = {
  slug: "blog-authors",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Blog",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection("blog-authors")],
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "bio", type: "textarea" },
    { name: "avatar", type: "upload", relationTo: "media" },
  ],
}
