import { FastifyInstance } from "fastify"
import { desc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { verifyAuth } from "../../middleware/auth.js"
import { requireAdmin } from "../../middleware/require-admin.js"
import { messages, tickets, users } from "../../schema.js"
import { getErrorMessage } from "../../utils/error.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  adminCreateTicketSchema,
  getTicket,
  getTicketThread,
  replySchema,
  supportMessageOnlyResponseSchema,
  supportTicketCreatedResponseSchema,
  supportTicketListItemResponseSchema,
  supportTicketThreadResponseSchema,
  ticketIdParamsSchema,
  ticketListSelect,
} from "./shared.js"

export function registerAdminSupportRoutes(server: FastifyInstance) {
  server.get(
    "/admin/support/tickets",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "List all support tickets",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "array",
            items: supportTicketListItemResponseSchema,
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db
          .select(ticketListSelect())
          .from(tickets)
          .innerJoin(users, eq(tickets.userId, users.id))
          .orderBy(desc(tickets.updatedAt), desc(tickets.createdAt))
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )

  server.post(
    "/admin/support/tickets",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Create support ticket for user",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["userId", "subject", "message"],
          properties: {
            userId: { type: "integer" },
            subject: { type: "string" },
            message: { type: "string" },
          },
        },
        response: {
          201: supportTicketCreatedResponseSchema,
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const body = adminCreateTicketSchema.parse(request.body ?? {})
        const userResult = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, body.userId))
          .limit(1)

        if (!userResult[0]) {
          return reply.status(404).send({ error: "User not found" })
        }

        const created = await db.transaction(async (tx) => {
          const [ticket] = await tx
            .insert(tickets)
            .values({
              userId: body.userId,
              subject: body.subject,
              status: "open",
            })
            .returning()

          if (!ticket) {
            throw new Error("Failed to create ticket")
          }

          await tx.insert(messages).values({
            ticketId: ticket.id,
            senderType: "admin",
            senderUserId: request.user!.userId,
            message: body.message,
          })

          await tx
            .update(tickets)
            .set({ updatedAt: new Date() })
            .where(eq(tickets.id, ticket.id))

          return ticket
        })

        return reply.status(201).send({
          message: "Ticket created",
          ticket: created,
        })
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({ error: getErrorMessage(err) })
      }
    }
  )

  server.get(
    "/admin/support/tickets/:id",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Get support ticket with thread",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        response: {
          200: supportTicketThreadResponseSchema,
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const params = ticketIdParamsSchema.parse(request.params)
        const ticket = await getTicket(params.id)

        if (!ticket) {
          return reply.status(404).send({ error: "Ticket not found" })
        }

        return {
          ticket,
          messages: await getTicketThread(ticket.id),
        }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({ error: getErrorMessage(err) })
      }
    }
  )

  server.post(
    "/admin/support/tickets/:id/reply",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Reply to support ticket as admin",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        body: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string" },
          },
        },
        response: {
          200: supportMessageOnlyResponseSchema,
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        const params = ticketIdParamsSchema.parse(request.params)
        const body = replySchema.parse(request.body ?? {})
        const ticket = await getTicket(params.id)

        if (!ticket) {
          return reply.status(404).send({ error: "Ticket not found" })
        }

        await db.transaction(async (tx) => {
          await tx.insert(messages).values({
            ticketId: ticket.id,
            senderType: "admin",
            senderUserId: request.user!.userId,
            message: body.message,
          })

          await tx
            .update(tickets)
            .set({ status: "answered", updatedAt: new Date() })
            .where(eq(tickets.id, ticket.id))
        })

        return { message: "Reply added" }
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(400).send({ error: getErrorMessage(err) })
      }
    }
  )

  for (const action of ["close", "reopen"] as const) {
    server.post(
      `/admin/support/tickets/:id/${action}`,
      {
        preHandler: verifyAuth,
        schema: {
          tags: ["Support"],
          summary: action === "close" ? "Close ticket" : "Reopen ticket",
          security: [{ bearerAuth: [] }],
          params: {
            type: "object",
            required: ["id"],
            properties: {
              id: { type: "integer" },
            },
          },
          response: {
            200: supportMessageOnlyResponseSchema,
          },
        },
      },
      async (request: GenericRouteRequest, reply) => {
        try {
          if (!requireAdmin(request.user, reply)) {
            return
          }

          const params = ticketIdParamsSchema.parse(request.params)
          const ticket = await getTicket(params.id)

          if (!ticket) {
            return reply.status(404).send({ error: "Ticket not found" })
          }

          await db
            .update(tickets)
            .set({
              status: action === "close" ? "closed" : "open",
              updatedAt: new Date(),
            })
            .where(eq(tickets.id, ticket.id))

          return { message: `Ticket ${action === "close" ? "closed" : "reopened"}` }
        } catch (err: unknown) {
          server.log.error(err)
          return reply.status(400).send({ error: getErrorMessage(err) })
        }
      }
    )
  }
}

