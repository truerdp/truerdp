import { defineField } from "sanity"

export const faqPreviewSectionField = defineField({
  name: "faqPreviewSection",
  title: "FAQ Preview Section",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "headline", title: "Headline", type: "string" }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA Label",
      type: "string",
    }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      of: [
        defineField({
          name: "faq",
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
              rows: 3,
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
  ],
})

export const liveSupportSectionField = defineField({
  name: "liveSupportSection",
  title: "Live Support Section",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "headline", title: "Headline", type: "string" }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "topics",
      title: "Support Topics",
      type: "array",
      of: [
        defineField({
          name: "topic",
          title: "Topic",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "string",
            }),
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "description",
            },
          },
        }),
      ],
    }),
  ],
})

export const finalCtaField = defineField({
  name: "finalCta",
  title: "Final CTA",
  type: "object",
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "primaryCtaLabel",
      title: "Primary CTA Label",
      type: "string",
    }),
    defineField({
      name: "secondaryCtaLabel",
      title: "Secondary CTA Label",
      type: "string",
    }),
  ],
})

export const seoFields = [
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
]
