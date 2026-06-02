import type { CollectionConfig } from "payload"

import { editorAccess } from "../lib/revalidate"

export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  access: {
    ...editorAccess,
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "System",
    useAsTitle: "key",
    defaultColumns: ["key", "isActive", "updatedAt"],
  },
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true },
    { name: "subjectTemplate", type: "text", required: true },
    { name: "htmlTemplate", type: "textarea", required: true },
    { name: "textTemplate", type: "textarea" },
    { name: "isActive", type: "checkbox", required: true, defaultValue: true, index: true },
  ],
}
