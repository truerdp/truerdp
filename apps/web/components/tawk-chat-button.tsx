"use client"

import type { ComponentProps } from "react"

import { Button } from "@workspace/ui/components/button"

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void
      toggle?: () => void
      showWidget?: () => void
    }
  }
}

type TawkChatButtonProps = ComponentProps<typeof Button> & {
  fallbackId?: string
}

type ButtonClickEvent = Parameters<
  NonNullable<TawkChatButtonProps["onClick"]>
>[0]

export function TawkChatButton({
  children,
  fallbackId = "live-support",
  onClick,
  ...props
}: TawkChatButtonProps) {
  function openChat(event: ButtonClickEvent) {
    onClick?.(event)

    if (event.defaultPrevented) {
      return
    }

    const tawk = window.Tawk_API

    if (tawk?.maximize) {
      tawk.maximize()
      return
    }

    if (tawk?.toggle) {
      tawk.toggle()
      return
    }

    tawk?.showWidget?.()
    document
      .getElementById(fallbackId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <Button {...props} onClick={openChat}>
      {children}
    </Button>
  )
}
