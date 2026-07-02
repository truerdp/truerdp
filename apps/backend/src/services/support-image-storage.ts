import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, extname, join, normalize, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const MAX_SUPPORT_IMAGE_BYTES = 8 * 1024 * 1024
const SUPPORT_IMAGE_PREFIX = "support-tickets"
const LOCAL_SUPPORT_IMAGE_ROUTE_PREFIX = "/support/uploads/images"

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
])

const filename = fileURLToPath(import.meta.url)
const servicesDir = dirname(filename)
const backendRoot = resolve(servicesDir, "..", "..")
const localSupportImageRoot = join(
  backendRoot,
  ".uploads",
  SUPPORT_IMAGE_PREFIX
)

let cachedClient: S3Client | null = null

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is not configured`)
  }

  return value
}

function getR2Client() {
  if (cachedClient) {
    return cachedClient
  }

  cachedClient = new S3Client({
    region: "auto",
    endpoint:
      process.env.R2_ENDPOINT?.trim() ||
      (process.env.R2_ACCOUNT_ID?.trim()
        ? `https://${process.env.R2_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`
        : undefined),
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  })

  return cachedClient
}

function normalizeExtension(filename: string, mimeType: string) {
  const extension = extname(filename).toLowerCase()

  if (extension) {
    return extension
  }

  switch (mimeType) {
    case "image/jpeg":
      return ".jpg"
    case "image/png":
      return ".png"
    case "image/gif":
      return ".gif"
    case "image/webp":
      return ".webp"
    case "image/avif":
      return ".avif"
    case "image/bmp":
      return ".bmp"
    default:
      return ""
  }
}

function sanitizeFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "")

  return (
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "image"
  )
}

function createSupportImageKey(input: {
  filename: string
  contentType: string
  uploaderUserId: number
}) {
  const stamp = new Date().toISOString().slice(0, 10)
  const extension = normalizeExtension(input.filename, input.contentType)
  const safeName = sanitizeFilename(input.filename)

  return [
    String(input.uploaderUserId),
    stamp,
    `${safeName}-${randomUUID()}${extension}`,
  ].join("/")
}

function getStorageMode() {
  return process.env.NODE_ENV === "production" ? "r2" : "local"
}

function getLocalPublicBaseUrl() {
  const configuredBaseUrl = process.env.API_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "")
  }

  const port = process.env.PORT?.trim() || "3003"
  return `http://localhost:${port}`
}

export function getSupportImageUploadLimit() {
  return MAX_SUPPORT_IMAGE_BYTES
}

export function assertSupportedSupportImageType(mimeType: string) {
  if (!allowedImageTypes.has(mimeType)) {
    throw new Error("Only PNG, JPG, GIF, WebP, AVIF, and BMP images are allowed")
  }
}

export function assertSupportImageSize(size: number) {
  if (size > MAX_SUPPORT_IMAGE_BYTES) {
    throw new Error("Image is too large. Maximum file size is 8 MB")
  }
}

export function getSupportImageContentType(key: string) {
  switch (extname(key).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg"
    case ".png":
      return "image/png"
    case ".gif":
      return "image/gif"
    case ".webp":
      return "image/webp"
    case ".avif":
      return "image/avif"
    case ".bmp":
      return "image/bmp"
    default:
      return "application/octet-stream"
  }
}

export function resolveLocalSupportImagePath(key: string) {
  const normalizedKey = normalize(key).replace(/\\/g, "/")

  if (
    !normalizedKey ||
    normalizedKey.startsWith("/") ||
    normalizedKey.includes("../")
  ) {
    throw new Error("Invalid support image path")
  }

  const filePath = resolve(localSupportImageRoot, normalizedKey)

  if (!filePath.startsWith(localSupportImageRoot)) {
    throw new Error("Invalid support image path")
  }

  return filePath
}

async function uploadSupportImageToLocalDisk(input: {
  buffer: Buffer
  contentType: string
  filename: string
  uploaderUserId: number
}) {
  const key = createSupportImageKey(input)
  const filePath = resolveLocalSupportImagePath(key)

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, input.buffer)

  return {
    key,
    url: `${getLocalPublicBaseUrl()}${LOCAL_SUPPORT_IMAGE_ROUTE_PREFIX}/${key}`,
  }
}

async function uploadSupportImageToR2(input: {
  buffer: Buffer
  contentType: string
  filename: string
  uploaderUserId: number
}) {
  const bucket = getRequiredEnv("R2_BUCKET")
  const publicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL").replace(/\/$/, "")
  const key = `${SUPPORT_IMAGE_PREFIX}/${createSupportImageKey(input)}`

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.buffer,
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return {
    key,
    url: `${publicBaseUrl}/${key}`,
  }
}

export async function uploadSupportImage(input: {
  buffer: Buffer
  contentType: string
  filename: string
  uploaderUserId: number
}) {
  assertSupportedSupportImageType(input.contentType)
  assertSupportImageSize(input.buffer.byteLength)

  if (getStorageMode() === "r2") {
    return uploadSupportImageToR2(input)
  }

  return uploadSupportImageToLocalDisk(input)
}
