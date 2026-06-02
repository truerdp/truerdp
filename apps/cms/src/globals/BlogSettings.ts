import type { GlobalConfig } from "payload"

import { revalidateGlobal } from "../lib/revalidate"

export const BlogSettings: GlobalConfig = {
  slug: "blog-settings",
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "Blog",
  },
  hooks: {
    afterChange: [revalidateGlobal("blog-settings")],
  },
  fields: [
    { name: "heroTitle", type: "text", required: true, defaultValue: "TrueRDP Blog" },
    { name: "heroDescription", type: "textarea" },
    { name: "defaultOgImage", type: "upload", relationTo: "media" },
  ],
}
