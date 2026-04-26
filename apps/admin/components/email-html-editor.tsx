"use client"

import { useEffect, useRef } from "react"
import { Button } from "@workspace/ui/components/button"

type Props = {
  value: string
  onChange: (nextValue: string) => void
  variableTokens?: string[]
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

export default function EmailHtmlEditor({
  value,
  onChange,
  variableTokens = [],
}: Props) {
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
    <div className="overflow-hidden rounded-md border bg-background">
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
      <div ref={hostRef} className="min-h-56" />
    </div>
  )
}
