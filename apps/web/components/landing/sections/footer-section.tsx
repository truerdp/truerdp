import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadgeIcon, Home03Icon } from "@hugeicons/core-free-icons"

import { Reveal } from "@/components/landing/reveal"
import { defaultFooterColumns } from "./styles"
import type { FooterColumnLink, FooterContent } from "./types"

interface SiteFooterSectionProps {
  footer: FooterContent
  fallbackLinks: FooterColumnLink[]
}

export function SiteFooterSection({
  footer,
  fallbackLinks,
}: SiteFooterSectionProps) {
  const defaultFooterHrefs = new Set(
    defaultFooterColumns.flatMap((column) =>
      column.links.map((linkItem) => linkItem.href)
    )
  )
  const extraFallbackLinks = fallbackLinks.filter(
    (linkItem) => !defaultFooterHrefs.has(linkItem.href)
  )
  const columns =
    footer.columns.length > 0
      ? footer.columns
      : extraFallbackLinks.length > 0
        ? [
            ...defaultFooterColumns,
            {
              title: "More",
              links: extraFallbackLinks,
            },
          ]
        : defaultFooterColumns

  return (
    <footer className="mx-auto mt-12 w-full max-w-6xl px-6 pb-4">
      <Reveal>
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card">
          <div className="grid gap-8 border-b border-border/70 p-6 md:grid-cols-[1.2fr_1fr] lg:p-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
                TrueRDP
              </span>
              <p className="max-w-md text-sm text-muted-foreground">
                {footer.tagline}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
              {columns.map((column) => (
                <div key={column.title} className="space-y-3">
                  <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    {column.title}
                  </p>
                  <div className="flex flex-col gap-2">
                    {column.links.map((linkItem) => (
                      <Link
                        key={`${column.title}-${linkItem.label}-${linkItem.href}`}
                        href={linkItem.href}
                        className="text-sm text-foreground/85 transition-colors hover:text-foreground"
                      >
                        {linkItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-muted-foreground lg:px-8">
            <p>{footer.copyrightText}</p>
            <p className="inline-flex items-center gap-1.5">
              <HugeiconsIcon
                icon={CheckmarkBadgeIcon}
                size={14}
                strokeWidth={2}
              />
              Production-ready checkout and billing flow
            </p>
          </div>
        </div>
      </Reveal>
    </footer>
  )
}
