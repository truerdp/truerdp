import type { CollectionConfig } from "payload"

import { editorAccess } from "../lib/revalidate"

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    ...editorAccess,
    read: () => true,
  },
  admin: {
    group: "Content",
    useAsTitle: "alt",
  },
  upload: {
    staticDir: "media",
    mimeTypes: ["image/*"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
}
