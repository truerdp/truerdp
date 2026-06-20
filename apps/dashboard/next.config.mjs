import process from "node:process"

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)
const nextPublicAdminUrl =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3002" : undefined)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(nextPublicApiUrl || nextPublicAdminUrl
    ? {
        env: {
          ...(nextPublicApiUrl
            ? { NEXT_PUBLIC_API_URL: nextPublicApiUrl }
            : {}),
          ...(nextPublicAdminUrl
            ? { NEXT_PUBLIC_ADMIN_URL: nextPublicAdminUrl }
            : {}),
        },
      }
    : {}),
}

export default nextConfig
