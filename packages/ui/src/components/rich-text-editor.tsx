"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type RichTextEditorProps = {
  value: string
  onChange: (nextValue: string) => void
  placeholder?: string
  variableTokens?: string[]
  className?: string
  editorClassName?: string
  enableImages?: boolean
  uploadImage?: (file: File) => Promise<{ url: string; alt: string }>
}

type RichTextContentProps = {
  value: string
  className?: string
}

type QuillModule = typeof import("quill")
type QuillInstance = import("quill").default
type QuillSelection = { index: number; length: number } | null

let hasRegisteredImageResizor = false

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
const supportedImageMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
])

const MIN_IMAGE_WIDTH = 96
const MAX_IMAGE_WIDTH = 1200

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

function sanitizeImageWidth(width: string | null | undefined) {
  if (!width) {
    return ""
  }

  const normalizedWidth = width.trim().toLowerCase()
  const matchedWidth = normalizedWidth.match(/^(\d+)(px)?$/)
  const parsedWidth = matchedWidth?.[1] ? Number(matchedWidth[1]) : Number.NaN

  if (!Number.isFinite(parsedWidth)) {
    return ""
  }

  const clampedWidth = Math.min(
    MAX_IMAGE_WIDTH,
    Math.max(MIN_IMAGE_WIDTH, Math.round(parsedWidth))
  )

  return String(clampedWidth)
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function isSupportedImageFile(file: File) {
  return supportedImageMimeTypes.has(file.type)
}

function getImageAltText(file: File) {
  const stem = file.name.replace(/\.[^.]+$/, "").trim()

  if (!stem) {
    return "Support image"
  }

  return stem
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

function findImageWidth(
  image: HTMLImageElement,
  sourceImage?: HTMLImageElement | null
) {
  return sanitizeImageWidth(
    sourceImage?.style.width ||
      sourceImage?.getAttribute("width") ||
      image.style.width ||
      image.getAttribute("width")
  )
}

function serializeEditorHtml(root: HTMLElement) {
  const template = document.createElement("template")
  template.innerHTML = normalizeHtml(root.innerHTML)

  const sourceImages = Array.from(root.querySelectorAll("img"))
  const clonedImages = Array.from(template.content.querySelectorAll("img"))

  clonedImages.forEach((image, index) => {
    const sourceImage = sourceImages[index]
    const safeWidth = findImageWidth(image, sourceImage)

    image.removeAttribute("style")
    if (safeWidth) {
      image.setAttribute("width", safeWidth)
    } else {
      image.removeAttribute("width")
    }
  })

  return sanitizeHtml(template.innerHTML)
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
  const htmlElement = element as HTMLElement

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
  const width =
    element.tagName === "IMG"
      ? sanitizeImageWidth(
          element.getAttribute("width") || htmlElement.style.width || ""
        )
      : ""
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
    if (width) {
      element.setAttribute("width", width)
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
  enableImages = false,
  uploadImage,
}: RichTextEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const quillRef = useRef<QuillInstance | null>(null)
  const onChangeRef = useRef(onChange)
  const uploadImageRef = useRef(uploadImage)
  const pendingSelectionRef = useRef<QuillSelection>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    uploadImageRef.current = uploadImage
  }, [uploadImage])

  useEffect(() => {
    let cancelled = false
    let cleanupEditor: (() => void) | undefined

    async function mountEditor() {
      if (!hostRef.current || quillRef.current) {
        return
      }

      const [quillModule, imageResizorModule] = await Promise.all([
        import("quill") as Promise<QuillModule>,
        enableImages
          ? import("quill-image-resizor")
          : Promise.resolve(null),
      ])
      if (cancelled || !hostRef.current) {
        return
      }

      const Quill = quillModule.default
      if (enableImages && imageResizorModule && !hasRegisteredImageResizor) {
        imageResizorModule.default.Quill = Quill
        Quill.register("modules/imageResizor", imageResizorModule.default)
        hasRegisteredImageResizor = true
      }
      const toolbar = [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        enableImages
          ? ["link", "image", "blockquote", "code-block"]
          : ["link", "blockquote", "code-block"],
        [{ align: [] }],
        ["clean"],
      ]
      const quill = new Quill(hostRef.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar,
          ...(enableImages
            ? {
                imageResizor: {
                  modules: ["Resize", "DisplaySize"],
                  handleStyles: {
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "9999px",
                    width: "16px",
                    height: "16px",
                  },
                  displayStyles: {
                    backgroundColor: "color-mix(in oklch, black 65%, transparent)",
                    borderRadius: "6px",
                    color: "white",
                    fontSize: "12px",
                    padding: "4px 6px",
                  },
                },
              }
            : {}),
        },
      })

      const commitEditorValue = () => {
        onChangeRef.current(serializeEditorHtml(quill.root))
      }

      const insertUploadedImage = async (file: File, selection: QuillSelection) => {
        if (!enableImages || !uploadImageRef.current) {
          return
        }

        if (!isSupportedImageFile(file)) {
          toast.error("Only PNG, JPG, GIF, WebP, AVIF, and BMP images are allowed")
          return
        }

        const selectionIndex = selection?.index ?? quill.getLength()

        try {
          setIsUploadingImage(true)
          const uploadedImage = await uploadImageRef.current(file)
          const safeUrl = sanitizeUrl(uploadedImage.url)
          const safeAlt = (uploadedImage.alt || getImageAltText(file)).trim()

          if (!safeUrl) {
            throw new Error("Uploaded image URL is invalid")
          }

          quill.clipboard.dangerouslyPasteHTML(
            selectionIndex,
            `<p><img src="${escapeHtmlAttribute(safeUrl)}" alt="${escapeHtmlAttribute(
              safeAlt
            )}"></p>`,
            "user"
          )
          quill.setSelection(selectionIndex + 1, 0, "silent")
          commitEditorValue()
          quill.focus()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Unable to upload image"
          )
        } finally {
          setIsUploadingImage(false)
        }
      }

      if (enableImages) {
        const toolbarModule = quill.getModule("toolbar") as {
          addHandler?: (name: string, handler: () => void) => void
        } | null

        toolbarModule?.addHandler?.("image", () => {
          pendingSelectionRef.current = quill.getSelection(true)
          fileInputRef.current?.click()
        })

        const handlePaste = (event: ClipboardEvent) => {
          const clipboardFiles = Array.from(
            event.clipboardData?.files ?? []
          ).filter(isSupportedImageFile)

          if (clipboardFiles.length === 0) {
            return
          }

          event.preventDefault()
          void insertUploadedImage(clipboardFiles[0]!, quill.getSelection(true))
        }

        const handleDrop = (event: DragEvent) => {
          const droppedFiles = Array.from(event.dataTransfer?.files ?? []).filter(
            isSupportedImageFile
          )

          if (droppedFiles.length === 0) {
            return
          }

          event.preventDefault()
          void insertUploadedImage(droppedFiles[0]!, {
            index: quill.getSelection(true)?.index ?? quill.getLength(),
            length: 0,
          })
        }

        quill.root.addEventListener("paste", handlePaste)
        quill.root.addEventListener("drop", handleDrop)
        const syncAfterImageInteraction = () => {
          window.requestAnimationFrame(() => {
            commitEditorValue()
          })
        }
        quill.root.addEventListener("pointerup", syncAfterImageInteraction)
        quill.root.addEventListener("keyup", syncAfterImageInteraction)

        quill.clipboard.dangerouslyPasteHTML(value || "")
        commitEditorValue()
        quill.on("text-change", commitEditorValue)
        quillRef.current = quill
        cleanupEditor = () => {
          quill.root.removeEventListener("paste", handlePaste)
          quill.root.removeEventListener("drop", handleDrop)
          quill.root.removeEventListener("pointerup", syncAfterImageInteraction)
          quill.root.removeEventListener("keyup", syncAfterImageInteraction)
        }
        return
      }

      quill.on("text-change", () => {
        commitEditorValue()
      })
      quill.clipboard.dangerouslyPasteHTML(value || "")

      quillRef.current = quill
    }

    void mountEditor()

    return () => {
      cancelled = true
      cleanupEditor?.()
    }
  }, [enableImages, placeholder, value])

  useEffect(() => {
    if (!enableImages || !hostRef.current) {
      return
    }

    const imageButton = hostRef.current.querySelector<HTMLButtonElement>(
      ".ql-image"
    )

    if (imageButton) {
      imageButton.disabled = isUploadingImage
      imageButton.setAttribute("aria-busy", isUploadingImage ? "true" : "false")
    }
  }, [enableImages, isUploadingImage])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) {
      return
    }

    const imageResizorModule = quill.getModule("imageResizor") as
      | {
          hide?: () => void
          hideOverlay?: () => void
        }
      | undefined

    const editorHtml = serializeEditorHtml(quill.root)
    const incomingHtml = normalizeHtml(value)

    if (editorHtml === incomingHtml) {
      return
    }

    imageResizorModule?.hide?.()
    imageResizorModule?.hideOverlay?.()
    quill.clipboard.dangerouslyPasteHTML(incomingHtml)

    if (!incomingHtml) {
      imageResizorModule?.hide?.()
      imageResizorModule?.hideOverlay?.()
    }

    onChangeRef.current(serializeEditorHtml(quill.root))
  }, [value])

  const handleImageInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const quill = quillRef.current
    const selectedFile = event.target.files?.[0]

    event.target.value = ""

    if (!quill || !selectedFile || !enableImages || !uploadImageRef.current) {
      return
    }

    const selection = pendingSelectionRef.current ?? quill.getSelection(true)
    pendingSelectionRef.current = null

    if (!isSupportedImageFile(selectedFile)) {
      toast.error("Only PNG, JPG, GIF, WebP, AVIF, and BMP images are allowed")
      return
    }

    try {
      setIsUploadingImage(true)
      const uploadedImage = await uploadImageRef.current(selectedFile)
      const safeUrl = sanitizeUrl(uploadedImage.url)
      const safeAlt = (uploadedImage.alt || getImageAltText(selectedFile)).trim()
      const selectionIndex = selection?.index ?? quill.getLength()

      if (!safeUrl) {
        throw new Error("Uploaded image URL is invalid")
      }

      quill.clipboard.dangerouslyPasteHTML(
        selectionIndex,
        `<p><img src="${escapeHtmlAttribute(safeUrl)}" alt="${escapeHtmlAttribute(
          safeAlt
        )}"></p>`,
        "user"
      )
      quill.setSelection(selectionIndex + 1, 0, "silent")
      onChangeRef.current(serializeEditorHtml(quill.root))
      quill.focus()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload image"
      )
    } finally {
      setIsUploadingImage(false)
    }
  }

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
      <div
        ref={hostRef}
        className={cn("relative min-h-40", editorClassName)}
        data-uploading-image={isUploadingImage ? "true" : "false"}
      />
      {enableImages ? (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/bmp"
          className="sr-only"
          onChange={handleImageInputChange}
        />
      ) : null}
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
