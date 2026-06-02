import process from "node:process"

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  ...(nextPublicApiUrl
    ? {
        env: {
          NEXT_PUBLIC_API_URL: nextPublicApiUrl,
        },
      }
    : {}),
}

export default nextConfig
