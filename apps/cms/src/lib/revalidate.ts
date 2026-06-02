import type { CollectionAfterChangeHook, CollectionConfig, GlobalAfterChangeHook } from "payload"

function getWebBaseUrl() {
  return process.env.WEB_BASE_URL?.trim().replace(/\/$/, "") ?? ""
}

export async function notifyWebRevalidate(input: {
  collection?: string
  global?: string
  slug?: string | null
}) {
  const webBaseUrl = getWebBaseUrl()
  const secret = process.env.CMS_REVALIDATE_SECRET?.trim()

  if (!webBaseUrl || !secret) {
    return
  }

  await fetch(`${webBaseUrl}/api/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(input),
  }).catch((error) => {
    console.warn("[cms] failed to notify web revalidation", error)
  })
}

export function revalidateCollection(
  collection: string
): CollectionAfterChangeHook {
  return async ({ doc }) => {
    await notifyWebRevalidate({
      collection,
      slug:
        typeof doc?.slug === "string"
          ? doc.slug
          : typeof doc?.key === "string"
            ? doc.key
            : null,
    })
  }
}

export function revalidateGlobal(global: string): GlobalAfterChangeHook {
  return async ({ doc }) => {
    await notifyWebRevalidate({
      global,
      slug: typeof doc?.slug === "string" ? doc.slug : null,
    })
  }
}

export const editorAccess: CollectionConfig["access"] = {
  create: ({ req }) => Boolean(req.user),
  update: ({ req }) => Boolean(req.user),
  delete: ({ req }) => Boolean(req.user),
}
