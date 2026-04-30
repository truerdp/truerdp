"use client"

import { useSyncExternalStore } from "react"
import { VisualEditing } from "next-sanity/visual-editing"

type SanityPreviewProps = {
  isDraftMode: boolean
}

function subscribe() {
  return () => {}
}

function getIsStudioPreviewFrame() {
  return (
    typeof window !== "undefined" &&
    window.self !== window.top &&
    document.referrer.includes("/studio")
  )
}

export function SanityPreview({ isDraftMode }: SanityPreviewProps) {
  const isStudioPreviewFrame = useSyncExternalStore(
    subscribe,
    getIsStudioPreviewFrame,
    () => false
  )

  if (!isDraftMode || !isStudioPreviewFrame) {
    return null
  }

  return <VisualEditing />
}
