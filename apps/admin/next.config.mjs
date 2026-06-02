import process from "node:process"

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)
const nextPublicCmsUrl =
  process.env.NEXT_PUBLIC_CMS_URL ??
  process.env.PAYLOAD_PUBLIC_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3004" : undefined)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(nextPublicApiUrl || nextPublicCmsUrl
    ? {
        env: {
          ...(nextPublicApiUrl
            ? { NEXT_PUBLIC_API_URL: nextPublicApiUrl }
            : {}),
          ...(nextPublicCmsUrl
            ? { NEXT_PUBLIC_CMS_URL: nextPublicCmsUrl }
            : {}),
        },
      }
    : {}),
}

export default nextConfig
