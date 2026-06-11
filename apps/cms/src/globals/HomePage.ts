import type { GlobalConfig } from "payload"

import { seoFields } from "../fields"
import { revalidateGlobal } from "../lib/revalidate"

const textItemFields = [
  { name: "title", type: "text", required: true },
  { name: "description", type: "textarea" },
] as const

export const HomePage: GlobalConfig = {
  slug: "home-page",
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    group: "Website",
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    afterChange: [revalidateGlobal("home-page")],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      defaultValue: "TrueRDP Plans",
    },
    { name: "summary", type: "textarea" },
    {
      name: "offerMarquee",
      type: "group",
      fields: [{ name: "message", type: "text" }],
    },
    {
      name: "hero",
      type: "group",
      fields: [
        { name: "badge", type: "text" },
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        { name: "primaryCtaLabel", type: "text" },
        { name: "secondaryCtaLabel", type: "text" },
        { name: "trustLine", type: "text" },
      ],
    },
    {
      name: "valueProps",
      type: "array",
      fields: [...textItemFields],
    },
    {
      name: "valuePropsSection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
      ],
    },
    {
      name: "journeySection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        {
          name: "steps",
          type: "array",
          fields: [...textItemFields, { name: "details", type: "textarea" }],
        },
      ],
    },
    {
      name: "sections",
      type: "group",
      fields: [
        { name: "featuredPlansTitle", type: "text" },
        { name: "featuredPlansDescription", type: "textarea" },
        { name: "planGroupsTitle", type: "text" },
        { name: "planLocationsTitle", type: "text" },
        { name: "comparisonTitle", type: "text" },
        { name: "comparisonDescription", type: "textarea" },
      ],
    },
    {
      name: "locationSection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        { name: "footerTitle", type: "text" },
        { name: "footerDescription", type: "textarea" },
        { name: "ctaLabel", type: "text" },
      ],
    },
    {
      name: "testimonialsSection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
        { name: "ratingLabel", type: "text" },
        {
          name: "items",
          type: "array",
          fields: [
            { name: "quote", type: "textarea" },
            { name: "name", type: "text" },
            { name: "role", type: "text" },
          ],
        },
      ],
    },
    {
      name: "faqPreviewSection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        { name: "ctaLabel", type: "text" },
        {
          name: "items",
          type: "array",
          fields: [
            { name: "question", type: "text" },
            { name: "answer", type: "textarea" },
          ],
        },
      ],
    },
    {
      name: "liveSupportSection",
      type: "group",
      fields: [
        { name: "eyebrow", type: "text" },
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        { name: "topics", type: "array", fields: [...textItemFields] },
      ],
    },
    {
      name: "finalCta",
      type: "group",
      fields: [
        { name: "headline", type: "text" },
        { name: "description", type: "textarea" },
        { name: "primaryCtaLabel", type: "text" },
        { name: "secondaryCtaLabel", type: "text" },
      ],
    },
    ...seoFields,
  ],
}
