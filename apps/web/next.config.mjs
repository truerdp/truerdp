import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const configDir = dirname(fileURLToPath(import.meta.url))
const rootEnvPath = resolve(configDir, "../../.env")

function readRootEnvValue(key) {
  if (!existsSync(rootEnvPath)) {
    return undefined
  }

  const envContents = readFileSync(rootEnvPath, "utf8")
  const line = envContents
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${key}=`))

  if (!line) {
    return undefined
  }

  return line
    .slice(key.length + 1)
    .trim()
    .replace(/^['"]|['"]$/g, "")
}

const nextPublicApiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  readRootEnvValue("NEXT_PUBLIC_API_URL") ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3003" : undefined)

/** @type {import('next').NextConfig} */
const nextConfig = {
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
