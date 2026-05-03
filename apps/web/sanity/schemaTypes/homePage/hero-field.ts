import { defineField } from "sanity"

export const heroField = defineField({
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
    defineField({
      name: "trustLine",
      title: "Trust Line",
      type: "string",
    }),
  ],
})
