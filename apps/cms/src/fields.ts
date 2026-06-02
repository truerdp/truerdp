import type { Field } from "payload"

export const seoFields: Field[] = [
  {
    name: "seoTitle",
    type: "text",
    maxLength: 200,
  },
  {
    name: "seoDescription",
    type: "textarea",
    maxLength: 500,
  },
]

export const linkFields: Field[] = [
  {
    name: "label",
    type: "text",
    required: true,
  },
  {
    name: "href",
    type: "text",
    required: true,
  },
]

export const faqItemsField: Field = {
  name: "items",
  type: "array",
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
    },
    {
      name: "answer",
      type: "textarea",
      required: true,
    },
  ],
}
