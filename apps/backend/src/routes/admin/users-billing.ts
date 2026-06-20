import { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db } from "../../db.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import { users } from "../../schema.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  listAdminInvoices,
  listAdminTransactions,
  listPendingTransactions,
  sendExpiryReminderSweep,
} from "../../services/billing.js"
import { getAdminUser360, listAdminUsers } from "../../services/admin-user.js"
import {
  createAdminAuditLog,
  listAdminAuditLogs,
} from "../../services/admin-audit.js"
import { getErrorMessage } from "../../utils/error.js"
import { buildUserBillingDetails } from "../../services/billing/user-billing.js"
import {
  adminBillingDetailsUpdateSchema,
  adminQuerySchemas,
  adminUserProfileUpdateSchema,
} from "./shared.js"
import {
  customerPermissions,
  userHasPermission,
} from "../../services/permissions.js"

const {
  adminListPaginationQuerySchema,
  adminAuditLogQuerySchema,
  expiryReminderRunSchema,
  adminInvoiceListQuerySchema,
} = adminQuerySchemas

export async function registerAdminUsersBillingRoutes(server: FastifyInstance) {
  server.get(
    "/admin/users",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listAdminUsers()
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/users/:id",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        const userId = Number((request.params as Record<string, unknown>).id)

        if (!userHasPermission(request.user, customerPermissions.viewAs)) {
          return reply.status(403).send({ error: "Forbidden" })
        }

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(userId)) {
          return reply.status(400).send({ error: "Invalid user id" })
        }

        const user360 = await getAdminUser360(userId)

        if (!user360) {
          return reply.status(404).send({ error: "User not found" })
        }

        return user360
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.patch(
    "/admin/users/:id/profile",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Admin"],
        summary: "Update a user's admin-managed profile fields",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        body: {
          type: "object",
          required: ["role", "dateOfBirth", "reason"],
          properties: {
            role: {
              type: "string",
              enum: ["user", "operator", "admin"],
            },
            dateOfBirth: {
              type: ["string", "null"],
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            },
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              user: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  role: { type: "string" },
                  dateOfBirth: { type: ["string", "null"] },
                  updatedAt: { type: "string", format: "date-time" },
                },
                required: ["id", "role", "dateOfBirth", "updatedAt"],
              },
            },
            required: ["message", "user"],
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const userId = Number((request.params as Record<string, unknown>).id)

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(userId)) {
          return reply.status(400).send({ error: "Invalid user id" })
        }

        const body = adminUserProfileUpdateSchema.parse(request.body ?? {})
        const [currentUser] = await db
          .select({
            id: users.id,
            role: users.role,
            dateOfBirth: users.dateOfBirth,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!currentUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        if (
          currentUser.id === request.user!.userId &&
          body.role !== currentUser.role
        ) {
          return reply.status(400).send({
            error: "Admins cannot change their own role",
          })
        }

        const beforeState = {
          role: currentUser.role,
          dateOfBirth: currentUser.dateOfBirth,
        }
        const [updatedUser] = await db
          .update(users)
          .set({
            role: body.role,
            dateOfBirth: body.dateOfBirth,
          })
          .where(eq(users.id, userId))
          .returning({
            id: users.id,
            role: users.role,
            dateOfBirth: users.dateOfBirth,
            updatedAt: users.updatedAt,
          })

        if (!updatedUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "user.profile.update",
          entityType: "user",
          entityId: userId,
          reason: body.reason,
          beforeState,
          afterState: {
            role: updatedUser.role,
            dateOfBirth: updatedUser.dateOfBirth,
          },
        })

        return {
          message: "User profile updated",
          user: updatedUser,
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
    "/admin/users/:id/billing",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Admin"],
        summary: "Update a user's stored billing profile",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        body: {
          type: "object",
          required: [
            "email",
            "phone",
            "addressLine1",
            "city",
            "state",
            "postalCode",
            "country",
            "reason",
          ],
          properties: {
            email: { type: "string", format: "email" },
            phone: { type: "string" },
            companyName: { type: "string", nullable: true },
            taxId: { type: "string", nullable: true },
            addressLine1: { type: "string" },
            addressLine2: { type: "string", nullable: true },
            city: { type: "string" },
            state: { type: "string" },
            postalCode: { type: "string" },
            country: { type: "string" },
            reason: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
              billingDetails: {
                anyOf: [
                  {
                    type: "object",
                    properties: {
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      companyName: { type: "string", nullable: true },
                      taxId: { type: "string", nullable: true },
                      addressLine1: { type: "string" },
                      addressLine2: { type: "string", nullable: true },
                      city: { type: "string" },
                      state: { type: "string" },
                      postalCode: { type: "string" },
                      country: { type: "string" },
                    },
                  },
                  { type: "null" },
                ],
              },
            },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const userId = Number((request.params as Record<string, unknown>).id)

        if (!requireAdmin(request.user, reply)) {
          return
        }

        if (Number.isNaN(userId)) {
          return reply.status(400).send({ error: "Invalid user id" })
        }

        const body = adminBillingDetailsUpdateSchema.parse(request.body ?? {})
        const normalizedEmail = body.email
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!currentUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        if (normalizedEmail !== currentUser.email.trim().toLowerCase()) {
          const [existingUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1)

          if (existingUser && existingUser.id !== userId) {
            return reply.status(409).send({
              error: "Email already in use",
            })
          }
        }

        const beforeState = buildUserBillingDetails(currentUser)
        const [updatedUser] = await db
          .update(users)
          .set({
            email: normalizedEmail,
            billingPhone: body.phone,
            billingCompanyName: body.companyName,
            billingTaxId: body.taxId,
            billingAddressLine1: body.addressLine1,
            billingAddressLine2: body.addressLine2,
            billingCity: body.city,
            billingState: body.state,
            billingPostalCode: body.postalCode,
            billingCountry: body.country,
          })
          .where(eq(users.id, userId))
          .returning()

        if (!updatedUser) {
          return reply.status(404).send({ error: "User not found" })
        }

        const billingDetails = buildUserBillingDetails(updatedUser)

        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "user.billing_profile.update",
          entityType: "user",
          entityId: userId,
          reason: body.reason,
          beforeState,
          afterState: billingDetails,
        })

        return {
          message: "Billing profile updated",
          billingDetails,
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.get(
    "/admin/invoices",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminInvoiceListQuerySchema.parse(request.query ?? {})

        return await listAdminInvoices(query)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/transactions",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminListPaginationQuerySchema.parse(request.query ?? {})

        return await listAdminTransactions(query)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/transactions/pending",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await listPendingTransactions()
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({
          error: "Internal server error",
        })
      }
    }
  )

  server.get(
    "/admin/audit-logs",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const query = adminAuditLogQuerySchema.parse(request.query ?? {})
        return await listAdminAuditLogs(query)
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({
          error: getErrorMessage(err),
        })
      }
    }
  )

  server.post(
    "/admin/notifications/expiry-reminders/run",
    { preHandler: verifyAuth },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = expiryReminderRunSchema.parse(request.body ?? {})
        const result = await sendExpiryReminderSweep({
          daysAhead: body.daysAhead,
        })

        await createAdminAuditLog({
          adminUserId: request.user!.userId,
          action: "notification.expiry_reminder.run",
          entityType: "system",
          entityId: null,
          reason: "Admin triggered expiry reminder run",
          beforeState: null,
          afterState: {
            sent: result.sent,
            checked: result.checked,
          },
          metadata: {
            daysAhead: result.daysAhead,
          },
        })

        return {
          message: "Expiry reminder sweep completed",
          ...result,
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
