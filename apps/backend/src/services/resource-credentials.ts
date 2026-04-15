import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

const ENCRYPTION_ALGORITHM = "aes-256-gcm"

function getEncryptionKey() {
  const secret =
    process.env.RESOURCE_CREDENTIALS_SECRET ?? process.env.JWT_SECRET

  if (!secret) {
    throw new Error(
      "RESOURCE_CREDENTIALS_SECRET or JWT_SECRET must be configured"
    )
  }

  return createHash("sha256").update(secret).digest()
}

export function encryptCredential(value: string) {
  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".")
}

export function decryptCredential(payload: string) {
  const [ivRaw, tagRaw, encryptedRaw] = payload.split(".")

  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted credential payload")
  }

  const key = getEncryptionKey()
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivRaw, "base64")
  )

  decipher.setAuthTag(Buffer.from(tagRaw, "base64"))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}
