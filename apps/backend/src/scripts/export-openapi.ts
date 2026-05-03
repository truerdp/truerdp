/**
 * export-openapi.ts
 *
 * Boots the Fastify server just long enough to collect the fully-resolved
 * OpenAPI spec, writes it to openapi.json at the repo root, then exits.
 *
 * Usage:
 *   pnpm --filter backend exec tsx src/scripts/export-openapi.ts
 *   # or from apps/backend:
 *   npx tsx src/scripts/export-openapi.ts
 *
 * The generated openapi.json can then be imported into Postman:
 *   Postman → Import → select openapi.json → "Import as API" or "Collection"
 */

import "dotenv/config"
import { writeFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"

// ── Inline a minimal server bootstrap (mirrors index.ts but skips listen) ──
import Fastify from "fastify"
import { parse as parseQueryString } from "node:querystring"
import cookie from "@fastify/cookie"
import cors from "@fastify/cors"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { userRoutes } from "../routes/user.js"
import { betterAuthRoutes } from "../routes/better-auth.js"
import { transactionRoutes } from "../routes/transaction.js"
import { adminRoutes } from "../routes/admin.js"
import { instanceRoutes } from "../routes/instance.js"
import { planRoutes } from "../routes/plan.js"
import { webhookRoutes } from "../routes/webhook.js"
import { orderRoutes } from "../routes/order.js"
import { supportRoutes } from "../routes/support.js"
import { contentRoutes } from "../routes/content.js"
import fastifyRawBody from "fastify-raw-body"

const __dirname = dirname(fileURLToPath(import.meta.url))

async function exportSpec() {
  const server = Fastify({ logger: false })

  server.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "TrueRDP API",
        description:
          "Auto-generated OpenAPI spec for the TrueRDP backend. " +
          "Re-import into Postman after adding new routes.",
        version: "1.0.0",
      },
      servers: [
        {
          url: process.env.API_BASE_URL ?? "http://localhost:3003",
          description: "Local dev server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "better-auth.session_token",
          },
        },
      },
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      tags: [
        { name: "Health", description: "Health check" },
        { name: "User", description: "User profile management" },
        { name: "Plans", description: "Public plan catalogue" },
        { name: "Orders", description: "Billing orders" },
        { name: "Instances", description: "RDP instance management" },
        {
          name: "Transactions",
          description: "Payment transactions & invoices",
        },
        { name: "Support", description: "Support tickets" },
        { name: "Admin", description: "Admin-only operations" },
        { name: "Content", description: "CMS pages & email templates" },
        { name: "Webhooks", description: "Payment provider webhooks" },
      ],
    },
  })

  server.register(swaggerUi, { routePrefix: "/docs" })

  server.register(fastifyRawBody, {
    field: "rawBody",
    global: true,
    runFirst: true,
  })

  server.addContentTypeParser(
    /^application\/x-www-form-urlencoded(?:;.*)?$/,
    { parseAs: "string" },
    (_request, body: string, done) => {
      done(null, parseQueryString(body))
    }
  )

  server.register(cookie)
  server.register(cors, { origin: true, credentials: true })

  server.register(userRoutes)
  server.register(betterAuthRoutes)
  server.register(planRoutes)
  server.register(orderRoutes)
  server.register(transactionRoutes)
  server.register(adminRoutes)
  server.register(instanceRoutes)
  server.register(supportRoutes)
  server.register(contentRoutes)
  server.register(webhookRoutes)

  server.get(
    "/",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async () => ({ status: "ok", message: "Truerdp API is running" })
  )

  // Ready the server so swagger collects all routes
  await server.ready()

  const spec = server.swagger()

  // Write to repo root
  const outPath = resolve(__dirname, "../../../../openapi.json")
  writeFileSync(outPath, JSON.stringify(spec, null, 2), "utf-8")

  console.log(`✅  OpenAPI spec written to: ${outPath}`)
  console.log(
    `    Routes exported: ${Object.keys((spec as { paths: Record<string, unknown> }).paths ?? {}).length} paths`
  )
  console.log()
  console.log("Next steps — sync with Postman:")
  console.log(
    "  1. In Postman: click Import → select openapi.json → Import as Collection"
  )
  console.log(
    "  2. Or use the Postman CLI: postman collection import openapi.json"
  )
  console.log(
    "  3. Re-run this script whenever you add new routes, then re-import."
  )

  await server.close()
}

exportSpec().catch((err) => {
  console.error("Failed to export OpenAPI spec:", err)
  process.exit(1)
})
