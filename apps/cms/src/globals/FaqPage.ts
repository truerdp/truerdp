import type { GlobalConfig } from "payload"

import { faqItemsField, seoFields } from "../fields"
import { revalidateGlobal } from "../lib/revalidate"

export const FaqPage: GlobalConfig = {
  slug: "faq-page",
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "Website",
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    afterChange: [revalidateGlobal("faq-page")],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "Frequently Asked Questions",
    },
    { name: "summary", type: "textarea" },
    faqItemsField,
    ...seoFields,
  ],
}
