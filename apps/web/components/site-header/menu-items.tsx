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
import type { MenuItem } from "./types"

export function renderDesktopMenuItem(item: MenuItem) {
  if (item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          {item.items.map((subItem) => (
            <NavigationMenuLink
              key={subItem.title}
              render={<Link href={subItem.url} />}
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
      <NavigationMenuLink render={<Link href={item.url} />}>
        {item.title}
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

export function renderMobileMenuItem(item: MenuItem, onNavigate: () => void) {
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

export function MobileSubMenuLink({
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
