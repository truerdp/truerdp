"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home03Icon,
  LoginSquare02Icon,
  Logout01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"

import { logout } from "@/lib/auth"
import ThemeToggle from "@/components/theme-toggle"
import { useProfile } from "@/hooks/use-profile"
import { webPaths } from "@/lib/paths"
import { Button } from "@workspace/ui/components/button"
import { NavigationMenu, NavigationMenuList } from "@workspace/ui/components/navigation-menu"
import { renderDesktopMenuItem } from "@/components/site-header/menu-items"
import { MobileNavSheet } from "@/components/site-header/mobile-nav-sheet"
import type { HeaderLink, MenuItem } from "@/components/site-header/types"

export default function SiteHeader({
  brandName = "TrueRDP",
  headerLinks,
}: {
  brandName?: string
  headerLinks?: HeaderLink[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const profileQuery = useProfile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)

  if (pathname?.startsWith("/studio")) {
    return null
  }

  const menu: MenuItem[] = (headerLinks ?? [])
    .filter((item) => Boolean(item.label && item.href))
    .map((item) => ({
      title: item.label as string,
      url: item.href as string,
    }))

  async function onLogout() {
    try {
      setIsLoggingOut(true)
      await logout()
      queryClient.setQueryData(["profile"], null)
      await queryClient.invalidateQueries()
      toast.success("Logged out")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to logout"
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-[oklch(0.99_0.018_84)]/88 shadow-sm shadow-[oklch(0.56_0.1_230)]/5 backdrop-blur dark:border-white/10 dark:bg-[oklch(0.17_0.035_255)]/88">
      <section className="py-4">
        <div className="mx-auto w-full max-w-6xl px-6">
          <nav className="hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-6">
              <BrandLink brandName={brandName} />
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderDesktopMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!isAuthenticated ? (
                <>
                  <Link href={webPaths.login}>
                    <Button variant="outline" size="sm">
                      <HugeiconsIcon
                        icon={LoginSquare02Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Login
                    </Button>
                  </Link>
                  <Link href={webPaths.signup}>
                    <Button size="sm">
                      <HugeiconsIcon
                        icon={UserAdd01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Sign up
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                >
                  <HugeiconsIcon
                    icon={Logout01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Logout
                </Button>
              )}
            </div>
          </nav>

          <div className="flex items-center justify-between lg:hidden">
            <BrandLink brandName={brandName} />
            <MobileNavSheet
              brandName={brandName}
              menu={menu}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              isAuthenticated={isAuthenticated}
              isLoggingOut={isLoggingOut}
              onLogout={onLogout}
            />
          </div>
        </div>
      </section>
    </header>
  )
}

function BrandLink({ brandName }: { brandName: string }) {
  return (
    <Link
      href={webPaths.home}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[oklch(0.24_0.08_260)] dark:text-white"
    >
      <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.78_0.16_76),oklch(0.7_0.14_190))] text-[oklch(0.18_0.045_250)] shadow-sm">
        <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
      </span>
      {brandName}
    </Link>
  )
}
