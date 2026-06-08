import config from "@payload-config"
import { getPayload } from "payload"

function isAuthorized(request: Request) {
  const configuredToken = process.env.CMS_INTERNAL_API_TOKEN?.trim()
  const header = request.headers.get("authorization") ?? ""

  return Boolean(configuredToken && header === `Bearer ${configuredToken}`)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: "email-templates",
    where: {
      and: [{ key: { equals: key } }, { isActive: { equals: true } }],
    },
    limit: 1,
    overrideAccess: true,
  })

  const template = result.docs[0]

  if (!template) {
    return Response.json({ template: null })
  }

  return Response.json({
    template: {
      key: template.key,
      subjectTemplate: template.subjectTemplate,
      htmlTemplate: template.htmlTemplate,
      textTemplate: template.textTemplate ?? null,
    },
  })
}
