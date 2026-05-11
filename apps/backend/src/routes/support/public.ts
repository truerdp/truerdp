import type { FastifyInstance } from "fastify"
import z from "zod"
import { sendAdminAlertEmail } from "../../services/email.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"

const contactTopicSchema = z.enum([
  "plan_guidance",
  "billing",
  "provisioning",
  "technical_issue",
  "other",
])

const publicContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(320),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  topic: contactTopicSchema.default("other"),
  companyName: z.string().trim().max(120).optional().nullable(),
  orderReference: z.string().trim().max(120).optional().nullable(),
  website: z.string().trim().max(320).optional(),
})

function formatContactPayloadText(
  input: z.infer<typeof publicContactSchema>,
  request: GenericRouteRequest
) {
  const lines = [
    "New contact form submission",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Topic: ${input.topic}`,
    `Subject: ${input.subject}`,
    `Company: ${input.companyName || "-"}`,
    `Order Reference: ${input.orderReference || "-"}`,
    `IP: ${request.ip || "-"}`,
    `User Agent: ${(request.headers["user-agent"] as string | undefined) || "-"}`,
    "",
    "Message:",
    input.message,
  ]

  return lines.join("\n")
}

export function registerPublicSupportRoutes(server: FastifyInstance) {
  server.post(
    "/support/contact",
    {
      schema: {
        tags: ["Support"],
        summary: "Submit public contact form",
        body: {
          type: "object",
          required: ["name", "email", "subject", "message", "topic"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            subject: { type: "string" },
            message: { type: "string" },
            topic: {
              type: "string",
              enum: contactTopicSchema.options,
            },
            companyName: { type: "string", nullable: true },
            orderReference: { type: "string", nullable: true },
            website: { type: "string" },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
          503: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const body = publicContactSchema.parse(request.body ?? {})

        // Honeypot: silently accept but skip sending.
        if (body.website && body.website.trim().length > 0) {
          return reply.status(201).send({
            message: "Thanks. Your message has been received.",
          })
        }

        const alertResult = await sendAdminAlertEmail({
          subject: `[Contact] ${body.subject}`,
          text: formatContactPayloadText(body, request),
        })

        if (!alertResult.sent) {
          return reply.status(503).send({
            error: "Contact service is temporarily unavailable",
          })
        }

        return reply.status(201).send({
          message: "Thanks. Your message has been received.",
        })
      } catch (error: unknown) {
        server.log.error(error)
        return reply.status(400).send({ error: getErrorMessage(error) })
      }
    }
  )
}
