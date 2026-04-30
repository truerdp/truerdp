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
const nextPublicTawkToPropertyId =
  process.env.NEXT_PUBLIC_TAWK_TO_PROPERTY_ID ??
  readRootEnvValue("NEXT_PUBLIC_TAWK_TO_PROPERTY_ID")
const nextPublicTawkToWidgetId =
  process.env.NEXT_PUBLIC_TAWK_TO_WIDGET_ID ??
  readRootEnvValue("NEXT_PUBLIC_TAWK_TO_WIDGET_ID")

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
