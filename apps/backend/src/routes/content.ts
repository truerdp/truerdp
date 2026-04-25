import { FastifyInstance } from "fastify"
import { and, desc, eq } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import { cmsPages, emailTemplates } from "../schema.js"
import { verifyAuth } from "../middleware/auth.js"
import { createAdminAuditLog } from "../services/admin-audit.js"

function requireAdmin(user: any, reply: any) {
  if (user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9-]+$/)

const pagePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).nullable().optional(),
  content: z.record(z.string(), z.unknown()).default({}),
  seoTitle: z.string().trim().max(200).nullable().optional(),
  seoDescription: z.string().trim().max(500).nullable().optional(),
  isPublished: z.boolean().default(false),
})

const publishPayloadSchema = z.object({
  isPublished: z.boolean(),
})

const templatePayloadSchema = z.object({
  subjectTemplate: z.string().trim().min(1),
  htmlTemplate: z.string().trim().min(1),
  textTemplate: z.string().trim().nullable().optional(),
  isActive: z.boolean().default(true),
})

export async function contentRoutes(server: FastifyInstance) {
  server.get("/content/:slug", async (request: any, reply) => {
    try {
      const slug = slugSchema.parse(request.params.slug)
      const [page] = await db
        .select()
        .from(cmsPages)
        .where(and(eq(cmsPages.slug, slug), eq(cmsPages.isPublished, true)))
        .limit(1)

      if (!page) {
        return reply.status(404).send({ error: "Content page not found" })
      }

      return page
    } catch (err: any) {
      server.log.error(err)
      return reply.status(400).send({
        error: err.message || "Invalid request",
      })
    }
  })

  server.get(
    "/admin/content/pages",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt))
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/content/pages/:slug",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse(request.params.slug)
        const [page] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, slug))
          .limit(1)

        if (!page) {
          return reply.status(404).send({ error: "Content page not found" })
        }

        return page
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.put(
    "/admin/content/pages/:slug",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse(request.params.slug)
        const body = pagePayloadSchema.parse(request.body ?? {})
        const [existingPage] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, slug))
          .limit(1)

        const [page] = existingPage
          ? await db
              .update(cmsPages)
              .set({
                title: body.title,
                summary: body.summary ?? null,
                content: body.content,
                seoTitle: body.seoTitle ?? null,
                seoDescription: body.seoDescription ?? null,
                isPublished: body.isPublished,
                publishedAt: body.isPublished ? new Date() : null,
              })
              .where(eq(cmsPages.slug, slug))
              .returning()
          : await db
              .insert(cmsPages)
              .values({
                slug,
                title: body.title,
                summary: body.summary ?? null,
                content: body.content,
                seoTitle: body.seoTitle ?? null,
                seoDescription: body.seoDescription ?? null,
                isPublished: body.isPublished,
                publishedAt: body.isPublished ? new Date() : null,
              })
              .returning()

        if (!page) {
          return reply.status(500).send({ error: "Failed to save content page" })
        }

        await createAdminAuditLog({
          adminUserId: request.user.userId,
          action: "content.page.save",
          entityType: "content_page",
          entityId: page.id,
          reason: "Admin saved CMS page",
          beforeState: existingPage
            ? {
                title: existingPage.title,
                isPublished: existingPage.isPublished,
                seoTitle: existingPage.seoTitle,
                seoDescription: existingPage.seoDescription,
              }
            : null,
          afterState: {
            title: page.title,
            isPublished: page.isPublished,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
          },
          metadata: {
            slug: page.slug,
          },
        })

        return {
          message: existingPage
            ? "Content page updated successfully"
            : "Content page created successfully",
          page,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.patch(
    "/admin/content/pages/:slug/publish",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse(request.params.slug)
        const body = publishPayloadSchema.parse(request.body ?? {})
        const [existingPage] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, slug))
          .limit(1)

        if (!existingPage) {
          return reply.status(404).send({ error: "Content page not found" })
        }

        const [updatedPage] = await db
          .update(cmsPages)
          .set({
            isPublished: body.isPublished,
            publishedAt: body.isPublished ? new Date() : null,
          })
          .where(eq(cmsPages.slug, slug))
          .returning()

        if (!updatedPage) {
          return reply.status(500).send({ error: "Failed to update page status" })
        }

        await createAdminAuditLog({
          adminUserId: request.user.userId,
          action: "content.page.publish",
          entityType: "content_page",
          entityId: updatedPage.id,
          reason: body.isPublished
            ? "Admin published CMS page"
            : "Admin unpublished CMS page",
          beforeState: {
            isPublished: existingPage.isPublished,
          },
          afterState: {
            isPublished: updatedPage.isPublished,
          },
          metadata: {
            slug: updatedPage.slug,
          },
        })

        return {
          message: body.isPublished
            ? "Page published successfully"
            : "Page unpublished successfully",
          page: updatedPage,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )

  server.get(
    "/admin/email-templates",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db
          .select()
          .from(emailTemplates)
          .orderBy(desc(emailTemplates.updatedAt))
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.put(
    "/admin/email-templates/:key",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const key = z.string().trim().min(1).max(120).parse(request.params.key)
        const body = templatePayloadSchema.parse(request.body ?? {})

        const [existingTemplate] = await db
          .select()
          .from(emailTemplates)
          .where(eq(emailTemplates.key, key))
          .limit(1)

        const [template] = existingTemplate
          ? await db
              .update(emailTemplates)
              .set({
                subjectTemplate: body.subjectTemplate,
                htmlTemplate: body.htmlTemplate,
                textTemplate: body.textTemplate ?? null,
                isActive: body.isActive,
              })
              .where(eq(emailTemplates.key, key))
              .returning()
          : await db
              .insert(emailTemplates)
              .values({
                key,
                subjectTemplate: body.subjectTemplate,
                htmlTemplate: body.htmlTemplate,
                textTemplate: body.textTemplate ?? null,
                isActive: body.isActive,
              })
              .returning()

        if (!template) {
          return reply.status(500).send({
            error: "Failed to save email template",
          })
        }

        await createAdminAuditLog({
          adminUserId: request.user.userId,
          action: "content.email_template.save",
          entityType: "email_template",
          entityId: template.id,
          reason: "Admin saved email template",
          beforeState: existingTemplate
            ? {
                isActive: existingTemplate.isActive,
              }
            : null,
          afterState: {
            isActive: template.isActive,
          },
          metadata: {
            key: template.key,
          },
        })

        return {
          message: existingTemplate
            ? "Email template updated successfully"
            : "Email template created successfully",
          template,
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({
          error: err.message || "Invalid request",
        })
      }
    }
  )
}
