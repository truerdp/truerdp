import Link from "next/link"

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@workspace/ui/components/navigation-menu"
import { cn } from "@workspace/ui/lib/utils"
import type { MenuItem } from "./types"

function normalizePath(url: string) {
  try {
    return new URL(url, "http://localhost").pathname.replace(/\/$/, "") || "/"
  } catch {
    return url.split("?")[0]?.replace(/\/$/, "") || "/"
  }
}

export function isMenuItemActive(item: MenuItem, pathname: string): boolean {
  const itemPath = normalizePath(item.url)
  const currentPath = normalizePath(pathname)
  const isActive =
    itemPath === "/"
      ? currentPath === itemPath
      : currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)

  return (
    isActive ||
    Boolean(item.items?.some((child) => isMenuItemActive(child, pathname)))
  )
}

function getActiveMenuPath(items: MenuItem[], pathname: string) {
  const currentPath = normalizePath(pathname)
  const paths = items.flatMap((item) => [
    normalizePath(item.url),
    ...(item.items?.map((child) => normalizePath(child.url)) ?? []),
  ])

  return (
    paths
      .filter((path) =>
        path === "/"
          ? currentPath === path
          : currentPath === path || currentPath.startsWith(`${path}/`)
      )
      .sort((a, b) => b.length - a.length)[0] ?? null
  )
}

function isDesktopMenuItemActive(item: MenuItem, activePath: string | null) {
  if (!activePath) {
    return false
  }

  return (
    normalizePath(item.url) === activePath ||
    Boolean(
      item.items?.some((child) => normalizePath(child.url) === activePath)
    )
  )
}

export function renderDesktopMenuItem(
  item: MenuItem,
  activePath: string | null
) {
  const isActive = isDesktopMenuItemActive(item, activePath)

  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger
          data-active={isActive}
          className="data-[active=true]:bg-muted data-[active=true]:text-foreground"
        >
          {item.title}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          {item.items.map((subItem) => (
            <NavigationMenuLink
              key={subItem.title}
              render={<Link href={subItem.url} />}
              data-active={isDesktopMenuItemActive(subItem, activePath)}
              aria-current={
                isDesktopMenuItemActive(subItem, activePath)
                  ? "page"
                  : undefined
              }
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
      <NavigationMenuLink
        render={<Link href={item.url} />}
        data-active={isActive}
        aria-current={isActive ? "page" : undefined}
        className="rounded-lg focus:bg-transparent active:bg-transparent data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 data-[active=true]:focus:bg-transparent"
      >
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

export { getActiveMenuPath }

export function renderMobileMenuItem(
  item: MenuItem,
  onNavigate: () => void,
  pathname: string
) {
  const isActive = isMenuItemActive(item, pathname)

  if (item.items) {
    return (
      <AccordionItem key={item.title} value={item.title}>
        <AccordionTrigger
          className={cn(
            "px-4 py-4 text-sm font-medium no-underline hover:no-underline",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          {item.title}
        </AccordionTrigger>
        <AccordionContent className="grid gap-2 pb-4 [&_a]:no-underline [&_a:hover]:no-underline">
          {item.items.map((subItem) => (
            <MobileSubMenuLink
              key={subItem.title}
              item={subItem}
              onClick={onNavigate}
              isActive={isMenuItemActive(subItem, pathname)}
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
      className={cn(
        "block w-full border-b border-border/60 px-4 py-4 text-sm font-medium last:border-b-0",
        isActive && "bg-primary/10 text-primary"
      )}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
    >
      {item.title}
    </Link>
  )
}

export function MobileSubMenuLink({
  item,
  onClick,
  isActive = false,
}: {
  item: MenuItem
  onClick: () => void
  isActive?: boolean
}) {
  return (
    <Link
      className={cn(
        "flex w-full flex-row items-start gap-4 rounded-2xl border border-border/70 bg-muted/30 px-3 py-3 text-left transition-colors hover:bg-muted",
        isActive && "border-primary/25 bg-primary/10 text-primary"
      )}
      href={item.url}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
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
