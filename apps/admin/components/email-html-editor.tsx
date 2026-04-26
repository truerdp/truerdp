"use client"

import { useEffect, useRef } from "react"

type Props = {
  value: string
  onChange: (nextValue: string) => void
}

type QuillModule = typeof import("quill")
type QuillInstance = import("quill").default

function normalizeHtml(input: string) {
  const trimmed = input.trim()
  if (!trimmed || trimmed === "<p><br></p>") {
    return ""
  }
  return trimmed
}

export default function EmailHtmlEditor({ value, onChange }: Props) {
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
        const html = normalizeHtml(quill.root.innerHTML)
        onChangeRef.current(html)
      })

      quillRef.current = quill
    }

    void mountEditor()

    return () => {
      cancelled = true
    }
  }, [value])

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

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div ref={hostRef} className="min-h-56" />
    </div>
  )
}
