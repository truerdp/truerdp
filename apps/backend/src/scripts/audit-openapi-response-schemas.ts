import { readFileSync } from "node:fs"
import { resolve } from "node:path"

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isBareObjectSchema(schema: JsonObject) {
  return (
    schema.type === "object" &&
    !("properties" in schema) &&
    !("additionalProperties" in schema) &&
    !("anyOf" in schema) &&
    !("oneOf" in schema) &&
    !("allOf" in schema) &&
    !("$ref" in schema)
  )
}

function walkSchema(schema: unknown, path: string, findings: string[]) {
  if (!isObject(schema)) {
    return
  }

  if (isBareObjectSchema(schema)) {
    findings.push(path)
  }

  if (
    schema.type === "array" &&
    isObject(schema.items) &&
    isBareObjectSchema(schema.items)
  ) {
    findings.push(`${path}.items`)
  }

  for (const [key, value] of Object.entries(schema)) {
    if (isObject(value) || Array.isArray(value)) {
      walkSchema(value, `${path}.${key}`, findings)
    }
  }
}

function getJsonResponseSchema(response: unknown) {
  if (!isObject(response) || !isObject(response.content)) {
    return null
  }

  const jsonContent = response.content["application/json"]

  if (!isObject(jsonContent)) {
    return null
  }

  return jsonContent.schema ?? null
}

const openApiPath = resolve(process.cwd(), "../../openapi.json")
const spec = JSON.parse(readFileSync(openApiPath, "utf8")) as JsonObject
const findings: string[] = []

if (isObject(spec.paths)) {
  for (const [route, methods] of Object.entries(spec.paths)) {
    if (!isObject(methods)) {
      continue
    }

    for (const [method, operation] of Object.entries(methods)) {
      if (!isObject(operation) || !isObject(operation.responses)) {
        continue
      }

      for (const [code, response] of Object.entries(operation.responses)) {
        const schema = getJsonResponseSchema(response)
        walkSchema(
          schema,
          `${method.toUpperCase()} ${route} ${code}`,
          findings
        )
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Bare object response schemas found:")
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exit(1)
}

console.log("No bare object response schemas found.")
