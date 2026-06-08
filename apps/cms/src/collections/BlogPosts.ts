import type { CollectionConfig } from "payload"

import { editorAccess, revalidateCollection } from "../lib/revalidate"
import { seoFields } from "../fields"

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Blog",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "publishAt", "_status"],
  },
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
  },
  hooks: {
    afterChange: [revalidateCollection("blog-posts")],
  },
  fields: [
    { name: "title", type: "text", required: true, maxLength: 180 },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "excerpt", type: "textarea", required: true, maxLength: 300 },
    { name: "coverImage", type: "upload", relationTo: "media", required: true },
    { name: "ogImage", type: "upload", relationTo: "media" },
    { name: "body", type: "richText", required: true },
    {
      name: "author",
      type: "relationship",
      relationTo: "blog-authors",
      required: true,
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "blog-categories",
      hasMany: true,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "blog-tags",
      hasMany: true,
    },
    { name: "publishAt", type: "date", required: true, index: true },
    { name: "isFeatured", type: "checkbox", defaultValue: false, index: true },
    ...seoFields,
  ],
}
