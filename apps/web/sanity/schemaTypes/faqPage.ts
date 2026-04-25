import { defineField, defineType } from "sanity"

export const faqPageTypeName = "faqPage"

export const faqPageSchema = defineType({
  name: faqPageTypeName,
  title: "FAQ Page",
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
      name: "items",
      title: "Questions",
      type: "array",
      of: [
        defineField({
          name: "item",
          title: "Question",
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 4,
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "question",
              subtitle: "answer",
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
