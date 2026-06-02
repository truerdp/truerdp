import config from "@payload-config"
import { getPayload } from "payload"

function isAuthorized(request: Request) {
  const configuredToken = process.env.CMS_INTERNAL_API_TOKEN?.trim()
  const header = request.headers.get("authorization") ?? ""

  return Boolean(configuredToken && header === `Bearer ${configuredToken}`)
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await getPayload({ config })
  await payload.find({ collection: "users", limit: 1, overrideAccess: true })

  return Response.json({ ok: true })
}
