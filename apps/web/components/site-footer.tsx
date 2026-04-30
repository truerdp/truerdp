"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home03Icon, CheckmarkBadgeIcon } from "@hugeicons/core-free-icons"
import { webPaths } from "@/lib/paths"

type FooterLink = {
  label?: string
  href?: string
}

type FooterColumn = {
  title?: string
  links?: FooterLink[]
}

type FooterContent = {
  tagline?: string
  copyrightText?: string
  statusText?: string
  columns?: FooterColumn[]
}

const defaultFooterColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Plans", href: webPaths.plans },
      { label: "Pricing", href: webPaths.plans },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: webPaths.faq },
      { label: "Contact", href: webPaths.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: webPaths.terms },
      { label: "Privacy", href: webPaths.privacy },
      { label: "Refund Policy", href: webPaths.refundPolicy },
    ],
  },
]

export default function SiteFooter({
  brandName = "TrueRDP",
  footer,
  footerLinks,
}: {
  brandName?: string
  footer?: FooterContent
  footerLinks?: FooterLink[]
}) {
  const year = new Date().getFullYear()
  const safeFooterLinks = footerLinks ?? []
  const defaultFooterHrefs = new Set(
    defaultFooterColumns.flatMap((column) =>
      (column.links ?? []).map((linkItem) => linkItem.href)
    )
  )
  const extraFallbackLinks = safeFooterLinks.filter(
    (linkItem) => linkItem.href && !defaultFooterHrefs.has(linkItem.href)
  )

  const columns =
    footer?.columns && footer.columns.length > 0
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
    <footer className="mx-auto mt-12 w-full max-w-6xl px-6 pb-8">
      <div className="overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(145deg,oklch(0.24_0.07_265),oklch(0.19_0.04_246)_58%,oklch(0.27_0.08_190))] text-white shadow-xl shadow-[oklch(0.45_0.12_245)]/12">
        <div className="h-1 bg-[linear-gradient(90deg,oklch(0.78_0.16_70),oklch(0.75_0.15_180),oklch(0.73_0.16_326))]" />
        <div className="grid gap-8 border-b border-white/12 p-6 md:grid-cols-[1.2fr_1fr] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <span className="inline-flex size-8 items-center justify-center rounded-2xl bg-white/12">
                <HugeiconsIcon icon={Home03Icon} size={18} strokeWidth={2} />
              </span>
              {brandName}
            </span>
            <p className="max-w-md text-sm leading-6 text-white/65">
              {footer?.tagline ??
                "Provision remote machines quickly and securely."}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title} className="space-y-3">
                <p className="text-xs tracking-[0.16em] text-white/45 uppercase">
                  {column.title}
                </p>
                <div className="flex flex-col gap-2">
                  {(column.links ?? []).map((linkItem) => (
                    <Link
                      key={`${column.title}-${linkItem.label}-${linkItem.href}`}
                      href={linkItem.href ?? "#"}
                      className="text-sm text-white/72 transition-colors hover:text-white"
                    >
                      {linkItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-white/55 lg:px-8">
          <p>
            {footer?.copyrightText ??
              `© ${year} ${brandName}. All rights reserved.`}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <HugeiconsIcon
              icon={CheckmarkBadgeIcon}
              size={14}
              strokeWidth={2}
            />
            {footer?.statusText ?? "Production-ready checkout and billing flow"}
          </p>
        </div>
      </div>
    </footer>
  )
}
