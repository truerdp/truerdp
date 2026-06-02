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

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(Object.keys(env).length > 0 ? { env } : {}),
}

export default nextConfig
