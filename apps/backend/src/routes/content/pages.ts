import { FastifyInstance } from "fastify"
import { desc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { cmsPages } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import { getErrorMessage } from "../../utils/error.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  pagePayloadSchema,
  publishPayloadSchema,
  slugSchema,
} from "./shared.js"

export function registerContentPageRoutes(server: FastifyInstance) {
  server.get(
    "/admin/content/pages",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }
        return await db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt))
      } catch (err: unknown) {
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
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse((request.params as Record<string, unknown>).slug)
        const [page] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, slug))
          .limit(1)

        if (!page) {
          return reply.status(404).send({ error: "Content page not found" })
        }
        return page
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.put(
    "/admin/content/pages/:slug",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse((request.params as Record<string, unknown>).slug)
        const body = pagePayloadSchema.parse(request.body ?? {})
        const [existingPage] = await db
          .select()
          .from(cmsPages)
          .where(eq(cmsPages.slug, slug))
          .limit(1)

        const [page] = existingPage ? await db
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
              .returning() : await db
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
          adminUserId: request.user!.userId,
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
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.patch(
    "/admin/content/pages/:slug/publish",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const slug = slugSchema.parse((request.params as Record<string, unknown>).slug)
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
          adminUserId: request.user!.userId,
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
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )
}
