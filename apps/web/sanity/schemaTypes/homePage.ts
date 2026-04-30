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
    }),
    defineField({
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
    }),
    defineField({
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
                  description:
                    "Short supporting points shown under this step.",
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
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
    }),
    defineField({
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
