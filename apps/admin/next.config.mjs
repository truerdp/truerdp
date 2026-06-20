import process from "node:process"

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)
const nextPublicCmsUrl =
  process.env.NEXT_PUBLIC_CMS_URL ??
  process.env.PAYLOAD_PUBLIC_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3004" : undefined)
const nextPublicDashboardUrl =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(nextPublicApiUrl || nextPublicCmsUrl || nextPublicDashboardUrl
    ? {
        env: {
          ...(nextPublicApiUrl
            ? { NEXT_PUBLIC_API_URL: nextPublicApiUrl }
            : {}),
          ...(nextPublicCmsUrl
            ? { NEXT_PUBLIC_CMS_URL: nextPublicCmsUrl }
            : {}),
          ...(nextPublicDashboardUrl
            ? { NEXT_PUBLIC_DASHBOARD_URL: nextPublicDashboardUrl }
            : {}),
        },
      }
    : {}),
}

export default nextConfig
