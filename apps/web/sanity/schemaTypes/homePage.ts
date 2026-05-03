import { defineField, defineType } from "sanity"

import {
  faqPreviewSectionField,
  finalCtaField,
  liveSupportSectionField,
  seoFields,
} from "@/sanity/schemaTypes/homePage/faq-support-seo-fields"
import { heroField } from "@/sanity/schemaTypes/homePage/hero-field"
import {
  locationSectionField,
  sectionsField,
  testimonialsSectionField,
} from "@/sanity/schemaTypes/homePage/section-and-social-proof-fields"
import {
  journeySectionField,
  valuePropsField,
  valuePropsSectionField,
} from "@/sanity/schemaTypes/homePage/value-and-journey-fields"

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
    heroField,
    valuePropsField,
    journeySectionField,
    valuePropsSectionField,
    sectionsField,
    locationSectionField,
    testimonialsSectionField,
    faqPreviewSectionField,
    liveSupportSectionField,
    finalCtaField,
    ...seoFields,
  ],
})
