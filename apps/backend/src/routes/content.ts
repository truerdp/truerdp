import { FastifyInstance } from "fastify"
import { registerEmailTemplateRoutes } from "./content/email-templates.js"
import { registerContentPageRoutes } from "./content/pages.js"
import { registerPublicContentRoutes } from "./content/public-pages.js"

export async function contentRoutes(server: FastifyInstance) {
  registerPublicContentRoutes(server)
  registerContentPageRoutes(server)
  registerEmailTemplateRoutes(server)
}
