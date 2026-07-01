"use client"

import { useEffect, useMemo, useRef } from "react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type RichTextEditorProps = {
  value: string
  onChange: (nextValue: string) => void
  placeholder?: string
  variableTokens?: string[]
  className?: string
  editorClassName?: string
}

type RichTextContentProps = {
  value: string
  className?: string
}

type QuillModule = typeof import("quill")
type QuillInstance = import("quill").default

const allowedTags = new Set([
  "A",
  "B",
  "BLOCKQUOTE",
  "BR",
  "CODE",
  "EM",
  "H1",
  "H2",
  "H3",
  "IMG",
  "I",
  "LI",
  "OL",
  "P",
  "PRE",
  "S",
  "SPAN",
  "STRONG",
  "U",
  "UL",
])

const allowedClasses = new Set([
  "ql-align-center",
  "ql-align-justify",
  "ql-align-right",
  "ql-direction-rtl",
])

const blockedTags = new Set(["IFRAME", "OBJECT", "SCRIPT", "STYLE"])

function normalizeHtml(input: string) {
  const trimmed = input.trim()
  if (!trimmed || trimmed === "<p><br></p>") {
    return ""
  }
  return trimmed
}

function hasHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input)
}

function sanitizeUrl(url: string) {
  try {
    const parsed = new URL(url, window.location.origin)
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return url
    }
  } catch {
    return ""
  }

  return ""
}

function sanitizeImageSrc(src: string) {
  const trimmedSrc = src.trim()
  if (!trimmedSrc) {
    return ""
  }

  if (
    /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp);base64,[a-z0-9+/=]+$/i.test(
      trimmedSrc
    )
  ) {
    return trimmedSrc
  }

  return sanitizeUrl(trimmedSrc)
}

function unwrapElement(element: Element) {
  const parent = element.parentNode
  if (!parent) {
    return
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

function sanitizeElement(element: Element) {
  if (blockedTags.has(element.tagName)) {
    element.remove()
    return
  }

  if (!allowedTags.has(element.tagName)) {
    unwrapElement(element)
    return
  }

  const href = element.tagName === "A" ? element.getAttribute("href") || "" : ""
  const src =
    element.tagName === "IMG" ? element.getAttribute("src") || "" : ""
  const alt =
    element.tagName === "IMG" ? element.getAttribute("alt")?.trim() || "" : ""
  const classNames = Array.from(element.classList)

  for (const attribute of Array.from(element.attributes)) {
    element.removeAttribute(attribute.name)
  }

  if (element.tagName === "A") {
    const safeHref = sanitizeUrl(href)
    if (safeHref) {
      element.setAttribute("href", safeHref)
      element.setAttribute("rel", "noreferrer noopener")
      element.setAttribute("target", "_blank")
    }
  }

  if (element.tagName === "IMG") {
    const safeSrc = sanitizeImageSrc(src)
    if (!safeSrc) {
      element.remove()
      return
    }

    element.setAttribute("src", safeSrc)
    if (alt) {
      element.setAttribute("alt", alt)
    }
    element.setAttribute("loading", "lazy")
  }

  const supportedClasses = classNames.filter((className) =>
    allowedClasses.has(className)
  )
  if (supportedClasses.length > 0) {
    element.setAttribute("class", supportedClasses.join(" "))
  }
}

function sanitizeHtml(input: string) {
  if (typeof window === "undefined") {
    return ""
  }

  const documentFragment = document.createElement("template")
  documentFragment.innerHTML = normalizeHtml(input)

  for (const element of Array.from(
    documentFragment.content.querySelectorAll("*")
  )) {
    sanitizeElement(element)
  }

  return documentFragment.innerHTML
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  variableTokens = [],
  className,
  editorClassName,
}: RichTextEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<QuillInstance | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    let cancelled = false

    async function mountEditor() {
      if (!hostRef.current || quillRef.current) {
        return
      }

      const quillModule: QuillModule = await import("quill")
      if (cancelled || !hostRef.current) {
        return
      }

      const Quill = quillModule.default
      const quill = new Quill(hostRef.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "blockquote", "code-block"],
            [{ align: [] }],
            ["clean"],
          ],
        },
      })

      quill.clipboard.dangerouslyPasteHTML(value || "")
      quill.on("text-change", () => {
        onChangeRef.current(normalizeHtml(quill.root.innerHTML))
      })

      quillRef.current = quill
    }

    void mountEditor()

    return () => {
      cancelled = true
    }
  }, [placeholder, value])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const editorHtml = normalizeHtml(quill.root.innerHTML)
    const incomingHtml = normalizeHtml(value)

    if (editorHtml === incomingHtml) {
      return
    }

    quill.clipboard.dangerouslyPasteHTML(incomingHtml)
  }, [value])

  const insertToken = (token: string) => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const selection = quill.getSelection(true)
    const index = selection?.index ?? quill.getLength()
    const tokenWithSpacing = `{{${token}}} `

    quill.insertText(index, tokenWithSpacing, "user")
    quill.setSelection(index + tokenWithSpacing.length, 0, "silent")
    quill.focus()
  }

  return (
    <div className={cn("overflow-hidden bg-background", className)}>
      {variableTokens.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-b bg-muted/30 px-3 py-2">
          {variableTokens.map((token) => (
            <Button
              key={token}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => insertToken(token)}
              className="h-7 px-2 text-xs"
            >
              {`{{${token}}}`}
            </Button>
          ))}
        </div>
      ) : null}
      <div ref={hostRef} className={cn("min-h-40", editorClassName)} />
    </div>
  )
}

export function RichTextContent({ value, className }: RichTextContentProps) {
  const normalizedValue = normalizeHtml(value)
  const sanitizedHtml = useMemo(
    () => (hasHtml(normalizedValue) ? sanitizeHtml(normalizedValue) : ""),
    [normalizedValue]
  )

  if (!normalizedValue) {
    return null
  }

  if (!sanitizedHtml) {
    return (
      <p className={cn("leading-6 whitespace-pre-wrap", className)}>{value}</p>
    )
  }

  return (
    <div
      className={cn("rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
