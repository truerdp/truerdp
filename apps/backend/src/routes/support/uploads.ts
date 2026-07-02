import type { FastifyInstance } from "fastify"
import { MultipartFile } from "@fastify/multipart"
import { access, constants } from "node:fs/promises"
import { createReadStream } from "node:fs"
import { verifyAuth } from "../../middleware/auth.js"
import type { GenericRouteRequest } from "../../types/requests.js"
import { getErrorMessage } from "../../utils/error.js"
import {
  assertSupportedSupportImageType,
  getSupportImageUploadLimit,
  getSupportImageContentType,
  resolveLocalSupportImagePath,
  uploadSupportImage,
} from "../../services/support-image-storage.js"

const supportUploadResponseSchema = {
  type: "object",
  properties: {
    image: {
      type: "object",
      properties: {
        url: { type: "string" },
        alt: { type: "string" },
      },
      required: ["url", "alt"],
    },
  },
  required: ["image"],
}

function buildAltText(filename: string) {
  const stem = filename.replace(/\.[^.]+$/, "").trim()

  if (!stem) {
    return "Support image"
  }

  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

async function readSingleImageFile(
  request: GenericRouteRequest
): Promise<MultipartFile> {
  for await (const part of request.parts()) {
    if (part.type !== "file") {
      continue
    }

    assertSupportedSupportImageType(part.mimetype)
    return part
  }

  throw new Error("No image file was uploaded")
}

export function registerSupportUploadRoutes(server: FastifyInstance) {
  server.get(
    "/support/uploads/images/*",
    {
      schema: {
        tags: ["Support"],
        summary: "Serve a locally stored support ticket image",
        params: {
          type: "object",
          properties: {
            "*": { type: "string" },
          },
          required: ["*"],
        },
        response: {
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
            required: ["error"],
          },
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        if (process.env.NODE_ENV === "production") {
          return reply.status(404).send({ error: "Not found" })
        }

        const wildcard =
          typeof (request.params as Record<string, unknown>)["*"] === "string"
            ? ((request.params as Record<string, unknown>)["*"] as string)
            : ""
        const filePath = resolveLocalSupportImagePath(wildcard)

        await access(filePath, constants.R_OK)

        reply.header("Cache-Control", "public, max-age=3600")
        reply.type(getSupportImageContentType(filePath))
        return reply.send(createReadStream(filePath))
      } catch (err: unknown) {
        return reply.status(404).send({ error: getErrorMessage(err, "Not found") })
      }
    }
  )

  server.post(
    "/support/uploads/images",
    {
      preHandler: verifyAuth,
      schema: {
        tags: ["Support"],
        summary: "Upload a support ticket image",
        security: [{ bearerAuth: [] }],
        consumes: ["multipart/form-data"],
        response: {
          201: supportUploadResponseSchema,
        },
      },
    },
    async (request: GenericRouteRequest, reply) => {
      try {
        const file = await readSingleImageFile(request)
        const buffer = await file.toBuffer()
        const uploaded = await uploadSupportImage({
          buffer,
          contentType: file.mimetype,
          filename: file.filename,
          uploaderUserId: request.user!.userId,
        })

        return reply.status(201).send({
          image: {
            url: uploaded.url,
            alt: buildAltText(file.filename),
          },
        })
      } catch (err: unknown) {
        const statusCode =
          err instanceof Error &&
          err.name === "RequestFileTooLargeError"
            ? 413
            : 400

        server.log.error(err)
        return reply.status(statusCode).send({ error: getErrorMessage(err) })
      }
    }
  )
}

export const supportMultipartOptions = {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024,
    fields: 5,
    fileSize: getSupportImageUploadLimit(),
    files: 1,
    headerPairs: 2000,
    parts: 10,
  },
  throwFileSizeLimit: true,
} as const
