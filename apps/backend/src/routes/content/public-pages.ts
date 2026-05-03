import { FastifyInstance } from "fastify"
import { and, eq } from "drizzle-orm"
import { db } from "../../db.js"
import { cmsPages } from "../../schema.js"
import { getErrorMessage } from "../../utils/error.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { slugSchema } from "./shared.js"

export function registerPublicContentRoutes(server: FastifyInstance) {
  server.get("/content/:slug", async (request: GenericRouteRequest, reply) => {
    try {
      const slug = slugSchema.parse((request.params as Record<string, unknown>).slug)
      const [page] = await db
        .select()
        .from(cmsPages)
        .where(and(eq(cmsPages.slug, slug), eq(cmsPages.isPublished, true)))
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
  })
}

