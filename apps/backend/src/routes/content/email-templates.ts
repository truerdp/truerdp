import { FastifyInstance } from "fastify"
import { desc, eq } from "drizzle-orm"
import z from "zod"
import { db } from "../../db.js"
import { emailTemplates } from "../../schema.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import { createAdminAuditLog } from "../../services/admin-audit.js"
import { getErrorMessage } from "../../utils/error.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { templatePayloadSchema } from "./shared.js"

export function registerEmailTemplateRoutes(server: FastifyInstance) {
  server.get(
    "/admin/email-templates",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db
          .select()
          .from(emailTemplates)
          .orderBy(desc(emailTemplates.updatedAt))
      } catch (err: unknown) {
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
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const key = z
          .string()
          .trim()
          .min(1)
          .max(120)
          .parse((request.params as Record<string, unknown>).key)
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
          adminUserId: request.user!.userId,
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
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )
}

