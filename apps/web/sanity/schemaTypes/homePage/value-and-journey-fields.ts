import { defineField } from "sanity"

export const valuePropsField = defineField({
  name: "valueProps",
  title: "Value Propositions",
  type: "array",
  of: [
    defineField({
      name: "valueProp",
      title: "Value Proposition",
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
          type: "text",
          rows: 2,
          validation: (rule) => rule.required(),
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
})

export const journeySectionField = defineField({
  name: "journeySection",
  title: "Customer Journey Section",
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
      name: "steps",
      title: "Steps",
      type: "array",
      of: [
        defineField({
          name: "step",
          title: "Step",
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
              type: "text",
              rows: 2,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "details",
              title: "Detail Points",
              description: "Short supporting points shown under this step.",
              type: "array",
              of: [{ type: "string" }],
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

export const valuePropsSectionField = defineField({
  name: "valuePropsSection",
  title: "Value Proposition Section",
  type: "object",
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
    }),
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
    }),
  ],
})
