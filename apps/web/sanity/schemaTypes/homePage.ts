import { defineField, defineType } from "sanity"

export const homePageTypeName = "homePage"

export const homePageSchema = defineType({
  name: homePageTypeName,
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        defineField({ name: "badge", title: "Badge", type: "string" }),
        defineField({
          name: "headline",
          title: "Headline",
          type: "string",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,
        }),
      ],
    }),
    defineField({
      name: "sections",
      title: "Section Labels",
      type: "object",
      fields: [
        defineField({
          name: "planGroupsTitle",
          title: "Plans By Type Title",
          type: "string",
        }),
        defineField({
          name: "planLocationsTitle",
          title: "Plans By Location Title",
          type: "string",
        }),
        defineField({
          name: "comparisonTitle",
          title: "Comparison Title",
          type: "string",
        }),
        defineField({
          name: "comparisonDescription",
          title: "Comparison Description",
          type: "text",
          rows: 2,
        }),
      ],
    }),
    defineField({
      name: "footerLinks",
      title: "Footer Links",
      type: "array",
      of: [
        defineField({
          name: "link",
          title: "Link",
          type: "object",
          fields: [
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
          ],
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
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 2,
    }),
  ],
})
