"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  Invoice03Icon,
  Home03Icon,
  LoginSquare02Icon,
  Logout01Icon,
  Menu01Icon,
  ServerStack01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { Button } from "@workspace/ui/components/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { logout } from "@/lib/auth"
import { useProfile } from "@/hooks/use-profile"
import { webPaths } from "@/lib/paths"

interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: ReactNode
  items?: MenuItem[]
}

export default function SiteHeader() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const profileQuery = useProfile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isAuthenticated = !profileQuery.isError && Boolean(profileQuery.data)

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

  const menu: MenuItem[] = [
    { title: "Home", url: webPaths.home },
    {
      title: "Products",
      url: "#",
      items: [
        {
          title: "Plans",
          description: "Choose a plan and start your checkout in minutes.",
          icon: <HugeiconsIcon icon={ServerStack01Icon} strokeWidth={2} />,
          url: webPaths.home,
        },
        {
          title: "Checkout",
          description: "Start by selecting a plan to create an order.",
          icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />,
          url: webPaths.home,
        },
      ],
    },
    {
      title: "Resources",
      url: "#",
      items: [
        {
          title: "Invoices",
          description: "Track payment status and unpaid invoice lifecycle.",
          icon: <HugeiconsIcon icon={Invoice03Icon} strokeWidth={2} />,
          url: webPaths.checkoutSuccess,
        },
      ],
    },
    { title: "Pricing", url: webPaths.home },
    { title: "Blog", url: "#" },
  ]

  return (
    <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
      <section className="py-4">
        <div className="mx-auto w-full max-w-6xl px-6">
          <nav className="hidden items-center justify-between lg:flex">
            <div className="flex items-center gap-6">
              <Link
                href={webPaths.home}
                className="inline-flex items-center gap-2 text-sm font-semibold"
              >
                <HugeiconsIcon
                  icon={Home03Icon}
                  size={18}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                TrueRDP
              </Link>

              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => renderDesktopMenuItem(item))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            <div className="flex items-center gap-2">
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
            <Link
              href={webPaths.home}
              className="inline-flex items-center gap-2 text-sm font-semibold"
            >
              <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
              TrueRDP
            </Link>

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
                      <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-background shadow-sm ring-1 ring-border">
                        <HugeiconsIcon
                          icon={Home03Icon}
                          size={18}
                          strokeWidth={2}
                        />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span>TrueRDP</span>
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
                        <p className="text-xs text-muted-foreground">
                          {menu.length} sections
                        </p>
                      </div>

                      <Accordion className="divide-y divide-border/60 overflow-visible rounded-none border-0 bg-transparent">
                        {menu.map((item) =>
                          renderMobileMenuItem(item, () =>
                            setMobileMenuOpen(false)
                          )
                        )}
                      </Accordion>
                    </section>

                    <section className="space-y-3">
                      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        Account
                      </p>

                      {!isAuthenticated ? (
                        <div className="grid grid-cols-1 gap-3">
                          <Link
                            href={webPaths.login}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Button variant="outline" className="w-full">
                              <HugeiconsIcon
                                icon={LoginSquare02Icon}
                                strokeWidth={2}
                                data-icon="inline-start"
                              />
                              Login
                            </Button>
                          </Link>
                          <Link
                            href={webPaths.signup}
                            onClick={() => setMobileMenuOpen(false)}
                          >
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
          </div>
        </div>
      </section>
    </header>
  )
}

function renderDesktopMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          {item.items.map((subItem) => (
            <NavigationMenuLink
              key={subItem.title}
              href={subItem.url}
              className="w-80 items-start gap-4"
            >
              <div className="text-foreground">{subItem.icon}</div>
              <div>
                <div className="text-sm font-semibold">{subItem.title}</div>
                {subItem.description ? (
                  <p className="text-sm leading-snug text-muted-foreground">
                    {subItem.description}
                  </p>
                ) : null}
              </div>
            </NavigationMenuLink>
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem key={item.title}>
      <NavigationMenuLink href={item.url}>{item.title}</NavigationMenuLink>
    </NavigationMenuItem>
  )
}

function renderMobileMenuItem(item: MenuItem, onNavigate: () => void) {
  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title}>
        <AccordionTrigger className="px-4 py-4 text-sm font-medium no-underline hover:no-underline">
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="grid gap-2 pb-4 [&_a]:no-underline [&_a:hover]:no-underline">
          {item.items.map((subItem) => (
            <MobileSubMenuLink
              key={subItem.title}
              item={subItem}
              onClick={onNavigate}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Link
      key={item.title}
      href={item.url}
      className="block w-full border-b border-border/60 px-4 py-4 text-sm font-medium last:border-b-0"
      onClick={onNavigate}
    >
      {item.title}
    </Link>
  )
}

function MobileSubMenuLink({
  item,
  onClick,
}: {
  item: MenuItem
  onClick: () => void
}) {
  return (
    <Link
      className="flex w-full flex-row items-start gap-4 rounded-2xl border border-border/70 bg-muted/30 px-3 py-3 text-left transition-colors hover:bg-muted"
      href={item.url}
      onClick={onClick}
    >
      <div className="mt-0.5 shrink-0 text-foreground">{item.icon}</div>
      <div className="min-w-0">
        <div className="text-sm leading-tight font-semibold">{item.title}</div>
        {item.description ? (
          <p className="mt-1 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        ) : null}
      </div>
    </Link>
  )
}
