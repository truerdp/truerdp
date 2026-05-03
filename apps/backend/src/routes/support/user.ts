import { FastifyInstance } from "fastify"
import { desc, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { verifyAuth } from "../../middleware/auth.js"
import { messages, tickets, users } from "../../schema.js"
import { getErrorMessage } from "../../utils/error.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import {
  createTicketSchema,
  getTicketForUser,
  getTicketThread,
  replySchema,
  ticketIdParamsSchema,
  ticketListSelect,
} from "./shared.js"

export function registerUserSupportRoutes(server: FastifyInstance) {
  server.get(
    "/support/tickets",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "List user support tickets",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "array",
            items: { type: "object" },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const rows = await db
          .select(ticketListSelect())
          .from(tickets)
          .innerJoin(users, eq(tickets.userId, users.id))
          .where(eq(tickets.userId, request.user!.userId))
          .orderBy(desc(tickets.updatedAt), desc(tickets.createdAt))

        return rows
      } catch (err: unknown) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )

  server.post(
    "/support/tickets",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Create support ticket",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["subject", "message"],
          properties: {
            subject: { type: "string" },
            message: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
              ticket: { type: "object" },
            },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const body = createTicketSchema.parse(request.body ?? {})
        const userId = request.user!.userId

        const created = await db.transaction(async (tx) => {
          const [ticket] = await tx
            .insert(tickets)
            .values({
              userId,
              subject: body.subject,
              status: "open",
            })
            .returning()

          if (!ticket) {
            throw new Error("Failed to create ticket")
          }

          await tx.insert(messages).values({
            ticketId: ticket.id,
            senderType: "user",
            senderUserId: userId,
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
    "/support/tickets/:id",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Get ticket with thread",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "integer" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              ticket: { type: "object" },
              messages: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const params = ticketIdParamsSchema.parse(request.params)
        const ticket = await getTicketForUser(params.id, request.user!.userId)

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
    "/support/tickets/:id/reply",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Reply to ticket",
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
          200: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const params = ticketIdParamsSchema.parse(request.params)
        const body = replySchema.parse(request.body ?? {})
        const userId = request.user!.userId
        const ticket = await getTicketForUser(params.id, userId)

        if (!ticket) {
          return reply.status(404).send({ error: "Ticket not found" })
        }

        await db.transaction(async (tx) => {
          if (ticket.status === "closed") {
            await tx
              .update(tickets)
              .set({ status: "open" })
              .where(eq(tickets.id, ticket.id))
          }

          await tx.insert(messages).values({
            ticketId: ticket.id,
            senderType: "user",
            senderUserId: userId,
            message: body.message,
          })

          await tx
            .update(tickets)
            .set({ updatedAt: new Date() })
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
      `/support/tickets/:id/${action}`,
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
            200: {
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
      },
      async (request: GenericRouteRequest, reply) => {
        try {
          const params = ticketIdParamsSchema.parse(request.params)
          const ticket = await getTicketForUser(params.id, request.user!.userId)

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

