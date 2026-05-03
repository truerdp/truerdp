import { FastifyInstance } from "fastify"

import { registerUserMeRoutes } from "./user/me.js"
import { registerUserProfileRoutes } from "./user/profile.js"

export async function userRoutes(server: FastifyInstance) {
  await registerUserMeRoutes(server)
  await registerUserProfileRoutes(server)
}
