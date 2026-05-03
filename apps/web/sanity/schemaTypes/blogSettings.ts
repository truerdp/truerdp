import { defineField, defineType } from "sanity"

export const blogSettingsTypeName = "blogSettings"

export const blogSettingsSchema = defineType({
  name: blogSettingsTypeName,
  title: "Blog Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Internal Title",
      type: "string",
      initialValue: "Blog Settings",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "heroTitle",
      title: "Blog Hero Title",
      type: "string",
      initialValue: "TrueRDP Blog",
    }),
    defineField({
      name: "heroDescription",
      title: "Blog Hero Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "defaultOgImage",
      title: "Default OG Image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "heroTitle",
      media: "defaultOgImage",
    },
  },
})
