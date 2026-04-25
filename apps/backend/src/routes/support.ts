import { FastifyInstance } from "fastify"
import { and, desc, eq, sql } from "drizzle-orm"
import z from "zod"
import { db } from "../db.js"
import { verifyAuth } from "../middleware/auth.js"
import { messages, tickets, users } from "../schema.js"

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(1).max(5000),
})

const adminCreateTicketSchema = createTicketSchema.extend({
  userId: z.number().int().positive(),
})

const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
})

const ticketIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

function requireAdmin(user: any, reply: any) {
  if (user.role !== "admin") {
    reply.status(403).send({ error: "Forbidden" })
    return false
  }

  return true
}

async function getTicketForUser(ticketId: number, userId: number) {
  const result = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
    .limit(1)

  return result[0] ?? null
}

async function getTicket(ticketId: number) {
  const result = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1)

  return result[0] ?? null
}

async function getTicketThread(ticketId: number) {
  return db
    .select({
      id: messages.id,
      ticketId: messages.ticketId,
      senderType: messages.senderType,
      senderUserId: messages.senderUserId,
      message: messages.message,
      createdAt: messages.createdAt,
      sender: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
      },
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderUserId, users.id))
    .where(eq(messages.ticketId, ticketId))
    .orderBy(messages.createdAt)
}

function ticketListSelect() {
  const lastMessageAt = sql<string | null>`(
    select max(${messages.createdAt})::text
    from ${messages}
    where ${messages.ticketId} = ${tickets.id}
  )`

  return {
    id: tickets.id,
    userId: tickets.userId,
    subject: tickets.subject,
    status: tickets.status,
    createdAt: tickets.createdAt,
    updatedAt: tickets.updatedAt,
    lastMessageAt,
    user: {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
  }
}

export async function supportRoutes(server: FastifyInstance) {
  server.get(
    "/support/tickets",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const rows = await db
          .select(ticketListSelect())
          .from(tickets)
          .innerJoin(users, eq(tickets.userId, users.id))
          .where(eq(tickets.userId, request.user.userId))
          .orderBy(desc(tickets.updatedAt), desc(tickets.createdAt))

        return rows
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )

  server.post(
    "/support/tickets",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const body = createTicketSchema.parse(request.body ?? {})
        const userId = request.user.userId

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
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  server.get(
    "/support/tickets/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const params = ticketIdParamsSchema.parse(request.params)
        const ticket = await getTicketForUser(params.id, request.user.userId)

        if (!ticket) {
          return reply.status(404).send({ error: "Ticket not found" })
        }

        return {
          ticket,
          messages: await getTicketThread(ticket.id),
        }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  server.post(
    "/support/tickets/:id/reply",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        const params = ticketIdParamsSchema.parse(request.params)
        const body = replySchema.parse(request.body ?? {})
        const userId = request.user.userId
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
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  for (const action of ["close", "reopen"] as const) {
    server.post(
      `/support/tickets/:id/${action}`,
      { preHandler: verifyAuth },
      async (request: any, reply) => {
        try {
          const params = ticketIdParamsSchema.parse(request.params)
          const ticket = await getTicketForUser(params.id, request.user.userId)

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
        } catch (err: any) {
          server.log.error(err)
          return reply.status(400).send({ error: err.message || "Invalid request" })
        }
      }
    )
  }

  server.get(
    "/admin/support/tickets",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
      try {
        if (!requireAdmin(request.user, reply)) {
          return
        }

        return await db
          .select(ticketListSelect())
          .from(tickets)
          .innerJoin(users, eq(tickets.userId, users.id))
          .orderBy(desc(tickets.updatedAt), desc(tickets.createdAt))
      } catch (err: any) {
        server.log.error(err)
        return reply.status(500).send({ error: "Internal server error" })
      }
    }
  )

  server.post(
    "/admin/support/tickets",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
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
            senderUserId: request.user.userId,
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
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  server.get(
    "/admin/support/tickets/:id",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
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
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  server.post(
    "/admin/support/tickets/:id/reply",
    { preHandler: verifyAuth },
    async (request: any, reply) => {
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
          if (ticket.status === "closed") {
            await tx
              .update(tickets)
              .set({ status: "open" })
              .where(eq(tickets.id, ticket.id))
          }

          await tx.insert(messages).values({
            ticketId: ticket.id,
            senderType: "admin",
            senderUserId: request.user.userId,
            message: body.message,
          })

          await tx
            .update(tickets)
            .set({ updatedAt: new Date() })
            .where(eq(tickets.id, ticket.id))
        })

        return { message: "Reply added" }
      } catch (err: any) {
        server.log.error(err)
        return reply.status(400).send({ error: err.message || "Invalid request" })
      }
    }
  )

  for (const action of ["close", "reopen"] as const) {
    server.post(
      `/admin/support/tickets/:id/${action}`,
      { preHandler: verifyAuth },
      async (request: any, reply) => {
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
        } catch (err: any) {
          server.log.error(err)
          return reply.status(400).send({ error: err.message || "Invalid request" })
        }
      }
    )
  }
}
