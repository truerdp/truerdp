import { defineArrayMember, defineField, defineType } from "sanity"

export const blogPostTypeName = "blogPost"

export const blogPostSchema = defineType({
  name: blogPostTypeName,
  title: "Blog Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().min(8).max(180),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 120,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required().min(40).max(300),
    }),
    defineField({
      name: "coverImage",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Number", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
            ],
            annotations: [
              defineArrayMember({
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "URL",
                    type: "url",
                    validation: (rule) => rule.required(),
                  }),
                ],
              }),
            ],
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "blogAuthor" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [
        defineField({
          name: "category",
          type: "reference",
          to: [{ type: "blogCategory" }],
        }),
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [
        defineField({
          name: "tag",
          type: "reference",
          to: [{ type: "blogTag" }],
        }),
      ],
    }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      validation: (rule) => rule.max(180),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(320),
    }),
    defineField({
      name: "ogImage",
      title: "OG Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "publishAt",
      title: "Publish At",
      type: "datetime",
      description:
        "Post appears publicly only when published and publishAt is in the past.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isFeatured",
      title: "Featured Post",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
      media: "coverImage",
      isPublished: "isPublished",
      publishAt: "publishAt",
    },
    prepare(selection) {
      const state = selection.isPublished ? "Published" : "Draft"
      const publishAt =
        typeof selection.publishAt === "string"
          ? new Date(selection.publishAt).toLocaleDateString()
          : ""

      return {
        title: selection.title,
        subtitle: `${state}${publishAt ? ` · ${publishAt}` : ""}`,
        media: selection.media,
      }
    },
  },
})
