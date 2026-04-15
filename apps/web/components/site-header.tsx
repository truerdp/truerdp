"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home03Icon,
  LoginSquare02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { clearAuthToken, getAuthToken } from "@/lib/auth"
import { webPaths } from "@/lib/paths"

export default function SiteHeader() {
  const [hasToken, setHasToken] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setHasToken(Boolean(getAuthToken()))
    setIsMounted(true)
  }, [])

  function onLogout() {
    clearAuthToken()
    setHasToken(false)
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href={webPaths.home}
          className="inline-flex items-center gap-2 text-sm font-semibold"
        >
          <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
          TrueRDP
        </Link>

        <div className="flex items-center gap-2">
          <Link href={webPaths.login}>
            <Button variant="outline" size="sm">
              <HugeiconsIcon
                icon={LoginSquare02Icon}
                size={16}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Login
            </Button>
          </Link>

          {!hasToken ? (
            <Link href={webPaths.signup}>
              <Button size="sm">
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  size={16}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Sign up
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
