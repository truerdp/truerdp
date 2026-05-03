import z from "zod"

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/)

export const pagePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).default({}),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(500).nullable().optional(),
  isPublished: z.boolean().default(false),
})

export const publishPayloadSchema = z.object({
  isPublished: z.boolean(),
})

export const templatePayloadSchema = z.object({
  subjectTemplate: z.string().trim().min(1),
  htmlTemplate: z.string().trim().min(1),
  textTemplate: z.string().trim().nullable().optional(),
  isActive: z.boolean().default(true),
})

