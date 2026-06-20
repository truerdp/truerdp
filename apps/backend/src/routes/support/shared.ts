import { and, eq, sql } from "drizzle-orm"
import z from "zod"
import { db } from "../../db.js"
import { messages, tickets, users } from "../../schema.js"

const ticketStatusValues = [
  "open",
  "answered",
  "customer_replied",
  "closed",
] as const

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(1).max(5000),
})

export const adminCreateTicketSchema = createTicketSchema.extend({
  userId: z.number().int().positive(),
})

export const replySchema = z.object({
  message: z.string().trim().min(1).max(5000),
})

export const ticketIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const supportUserSummaryResponseSchema = {
  type: "object",
  properties: {
    id: { type: ["integer", "null"] },
    firstName: { type: ["string", "null"] },
    lastName: { type: ["string", "null"] },
    email: { type: ["string", "null"] },
    role: { type: ["string", "null"] },
  },
  required: ["id", "firstName", "lastName", "email", "role"],
}

export const supportTicketResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    subject: { type: "string" },
    status: { type: "string", enum: ticketStatusValues },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
  required: ["id", "userId", "subject", "status", "createdAt", "updatedAt"],
}

export const supportTicketListItemResponseSchema = {
  type: "object",
  properties: {
    ...supportTicketResponseSchema.properties,
    lastMessageAt: { type: ["string", "null"] },
    user: {
      type: "object",
      properties: {
        id: { type: "integer" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
      },
      required: ["id", "firstName", "lastName", "email"],
    },
  },
  required: [...supportTicketResponseSchema.required, "lastMessageAt", "user"],
}

export const supportMessageResponseSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    ticketId: { type: "integer" },
    senderType: { type: "string" },
    senderUserId: { type: ["integer", "null"] },
    message: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    sender: {
      anyOf: [supportUserSummaryResponseSchema, { type: "null" }],
    },
  },
  required: [
    "id",
    "ticketId",
    "senderType",
    "senderUserId",
    "message",
    "createdAt",
    "sender",
  ],
}

export const supportTicketThreadResponseSchema = {
  type: "object",
  properties: {
    ticket: supportTicketResponseSchema,
    messages: {
      type: "array",
      items: supportMessageResponseSchema,
    },
  },
  required: ["ticket", "messages"],
}

export const supportTicketCreatedResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    ticket: supportTicketResponseSchema,
  },
  required: ["message", "ticket"],
}

export const supportMessageOnlyResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
}

export async function getTicketForUser(ticketId: number, userId: number) {
  const result = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
    .limit(1)

  return result[0] ?? null
}

export async function getTicket(ticketId: number) {
  const result = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1)

  return result[0] ?? null
}

export async function getTicketThread(ticketId: number) {
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

export function ticketListSelect() {
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

