import process from "node:process"

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)
const nextPublicTawkToPropertyId = process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID
const nextPublicTawkToWidgetId = process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID

const env = {
  ...(nextPublicApiUrl ? { NEXT_PUBLIC_API_URL: nextPublicApiUrl } : {}),
  ...(nextPublicTawkToPropertyId
    ? { NEXT_PUBLIC_TAWK_TO_PROPERTY_ID: nextPublicTawkToPropertyId }
    : {}),
  ...(nextPublicTawkToWidgetId
    ? { NEXT_PUBLIC_TAWK_TO_WIDGET_ID: nextPublicTawkToWidgetId }
    : {}),
}

function toRemotePattern(value) {
  const raw = value?.trim()

  if (!raw) {
    return null
  }

  try {
    const url = new URL(raw)

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/**",
    }
  } catch {
    return null
  }
}

const remotePatternSources = [
  "http://localhost:3004",
  "https://cms.truerdp.com",
  process.env.PAYLOAD_PUBLIC_URL,
  process.env.CMS_INTERNAL_API_URL,
  process.env.NEXT_PUBLIC_ADMIN_URL,
  process.env.R2_ENDPOINT,
]

const seenRemotePatterns = new Set()
const remotePatterns = remotePatternSources.flatMap((value) => {
  const pattern = toRemotePattern(value)

  if (!pattern) {
    return []
  }

  const key = `${pattern.protocol}://${pattern.hostname}:${pattern.port ?? ""}${pattern.pathname}`

  if (seenRemotePatterns.has(key)) {
    return []
  }

  seenRemotePatterns.add(key)
  return [pattern]
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(remotePatterns.length > 0 ? { images: { remotePatterns } } : {}),
  ...(Object.keys(env).length > 0 ? { env } : {}),
}

export default nextConfig
