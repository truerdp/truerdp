import type { GlobalConfig } from "payload"

import { linkFields } from "../fields"
import { revalidateGlobal } from "../lib/revalidate"

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "Website",
  },
  hooks: {
    afterChange: [revalidateGlobal("site-settings")],
  },
  fields: [
    { name: "brandName", type: "text", defaultValue: "TrueRDP" },
    {
      name: "headerLinks",
      type: "array",
      fields: linkFields,
    },
    {
      name: "footerLinks",
      type: "array",
      fields: linkFields,
    },
    {
      name: "footer",
      type: "group",
      fields: [
        { name: "tagline", type: "text" },
        { name: "copyrightText", type: "text" },
        { name: "statusText", type: "text" },
        {
          name: "columns",
          type: "array",
          fields: [
            { name: "title", type: "text", required: true },
            { name: "links", type: "array", fields: linkFields },
          ],
        },
      ],
    },
  ],
}
