import { defineField } from "sanity"

export const sectionsField = defineField({
  name: "sections",
  title: "Section Labels",
  type: "object",
  fields: [
    defineField({
      name: "featuredPlansTitle",
      title: "Featured Plans Title",
      type: "string",
    }),
    defineField({
      name: "featuredPlansDescription",
      title: "Featured Plans Description",
      type: "text",
      rows: 2,
    }),
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
})

export const locationSectionField = defineField({
  name: "locationSection",
  title: "Location Section",
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
      name: "footerTitle",
      title: "Footer Card Title",
      type: "string",
    }),
    defineField({
      name: "footerDescription",
      title: "Footer Card Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA Label",
      type: "string",
    }),
  ],
})

export const testimonialsSectionField = defineField({
  name: "testimonialsSection",
  title: "Testimonials Section",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "headline", title: "Headline", type: "string" }),
    defineField({
      name: "ratingLabel",
      title: "Rating Label",
      type: "string",
    }),
    defineField({
      name: "items",
      title: "Testimonials",
      type: "array",
      of: [
        defineField({
          name: "testimonial",
          title: "Testimonial",
          type: "object",
          fields: [
            defineField({
              name: "quote",
              title: "Quote",
              type: "text",
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "name",
              title: "Name",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "role", title: "Role", type: "string" }),
          ],
          preview: {
            select: {
              title: "name",
              subtitle: "quote",
            },
          },
        }),
      ],
    }),
  ],
})
