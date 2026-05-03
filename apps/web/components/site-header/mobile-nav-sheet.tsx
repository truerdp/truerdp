import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home03Icon,
  LoginSquare02Icon,
  Logout01Icon,
  Menu01Icon,
  ServerStack01Icon,
  UserAdd01Icon,
  Invoice03Icon,
} from "@hugeicons/core-free-icons"

import { webPaths } from "@/lib/paths"
import ThemeToggle from "@/components/theme-toggle"
import { Button } from "@workspace/ui/components/button"
import { Accordion } from "@workspace/ui/components/accordion"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { MobileSubMenuLink, renderMobileMenuItem } from "./menu-items"
import type { MenuItem } from "./types"

const mobileFeaturedLinks: MenuItem[] = [
  {
    title: "Browse Plans",
    description: "Compare plans by type, location, and resources.",
    icon: <HugeiconsIcon icon={ServerStack01Icon} strokeWidth={2} />,
    url: webPaths.plans,
  },
  {
    title: "Billing FAQ",
    description: "Answers about provisioning, renewals, and payments.",
    icon: <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />,
    url: webPaths.faq,
  },
]

interface MobileNavSheetProps {
  brandName: string
  menu: MenuItem[]
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  isAuthenticated: boolean
  isLoggingOut: boolean
  onLogout: () => void
}

export function MobileNavSheet({
  brandName,
  menu,
  mobileMenuOpen,
  setMobileMenuOpen,
  isAuthenticated,
  isLoggingOut,
  onLogout,
}: MobileNavSheetProps) {
  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" />}>
        <HugeiconsIcon icon={Menu01Icon} strokeWidth={2} />
      </SheetTrigger>
      <SheetContent className="overflow-y-auto p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b bg-muted/30 px-4 py-5">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Link
              href={webPaths.home}
              className="inline-flex items-center gap-2 text-sm font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,oklch(0.78_0.16_76),oklch(0.7_0.14_190))] text-[oklch(0.18_0.045_250)] shadow-sm">
                <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
              </span>
              <span className="flex flex-col leading-tight">
                <span>{brandName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Fast setup. Clean provisioning.
                </span>
              </span>
            </Link>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 px-4 py-5">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Browse
                </p>
                <p className="text-xs text-muted-foreground">{menu.length} links</p>
              </div>

              <div className="grid gap-2">
                {mobileFeaturedLinks.map((item) => (
                  <MobileSubMenuLink
                    key={item.title}
                    item={item}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>

              <Accordion className="divide-y divide-border/60 overflow-visible rounded-none border-0 bg-transparent">
                {menu.map((item) =>
                  renderMobileMenuItem(item, () => setMobileMenuOpen(false))
                )}
              </Accordion>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                Account
              </p>

              <ThemeToggle />

              {!isAuthenticated ? (
                <div className="grid grid-cols-1 gap-3">
                  <Link href={webPaths.login} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      <HugeiconsIcon
                        icon={LoginSquare02Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Login
                    </Button>
                  </Link>
                  <Link href={webPaths.signup} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      <HugeiconsIcon
                        icon={UserAdd01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Sign up
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
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
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
