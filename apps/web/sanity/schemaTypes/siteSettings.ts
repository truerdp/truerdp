import { defineField, defineType } from "sanity"

export const siteSettingsTypeName = "siteSettings"

const linkFields = [
  defineField({
    name: "label",
    title: "Label",
    type: "string",
    validation: (rule) => rule.required(),
  }),
  defineField({
    name: "href",
    title: "Href",
    type: "string",
    validation: (rule) => rule.required(),
  }),
]

export const siteSettingsSchema = defineType({
  name: siteSettingsTypeName,
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Internal Title",
      type: "string",
      initialValue: "Site Settings",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "brandName",
      title: "Brand Name",
      type: "string",
      initialValue: "TrueRDP",
    }),
    defineField({
      name: "headerLinks",
      title: "Header Links",
      type: "array",
      of: [
        defineField({
          name: "link",
          title: "Link",
          type: "object",
          fields: linkFields,
          preview: {
            select: {
              title: "label",
              subtitle: "href",
            },
          },
        }),
      ],
    }),
    defineField({
      name: "footerLinks",
      title: "Extra Footer Links",
      description:
        "Optional loose links. Footer columns below are preferred for the main footer.",
      type: "array",
      of: [
        defineField({
          name: "link",
          title: "Link",
          type: "object",
          fields: linkFields,
          preview: {
            select: {
              title: "label",
              subtitle: "href",
            },
          },
        }),
      ],
    }),
    defineField({
      name: "footer",
      title: "Footer",
      type: "object",
      fields: [
        defineField({
          name: "tagline",
          title: "Tagline",
          type: "string",
        }),
        defineField({
          name: "copyrightText",
          title: "Copyright Text",
          type: "string",
        }),
        defineField({
          name: "statusText",
          title: "Footer Status Text",
          type: "string",
          initialValue: "Production-ready checkout and billing flow",
        }),
        defineField({
          name: "columns",
          title: "Footer Columns",
          type: "array",
          of: [
            defineField({
              name: "column",
              title: "Column",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                  validation: (rule) => rule.required(),
                }),
                defineField({
                  name: "links",
                  title: "Links",
                  type: "array",
                  of: [
                    defineField({
                      name: "link",
                      title: "Link",
                      type: "object",
                      fields: linkFields,
                      preview: {
                        select: {
                          title: "label",
                          subtitle: "href",
                        },
                      },
                    }),
                  ],
                }),
              ],
              preview: {
                select: {
                  title: "title",
                },
              },
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "brandName",
    },
  },
})
