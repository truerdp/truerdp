import type { SiteSettings } from "@/lib/cms-types"

export const fallbackSiteSettings: SiteSettings = {
  brandName: "TrueRDP",
  headerLinks: [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "All Plans", href: "/plans" },
    { label: "Dedicated RDP", href: "/plans/dedicated" },
    { label: "Residential RDP", href: "/plans/residential" },
  ],
  footerLinks: [
    { label: "Blog", href: "/blog" },
    { label: "FAQ", href: "/faq" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Contact & Support", href: "/contact" },
  ],
  footer: {
    tagline:
      "High-performance Windows RDP plans for focused, always-on workloads.",
    copyrightText: "Copyright 2026 TrueRDP. All rights reserved.",
    statusText: "Production-ready checkout and billing flow",
    columns: [
      {
        title: "Product",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Plans", href: "/plans" },
          { label: "Pricing", href: "/plans" },
          { label: "Checkout", href: "/plans" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "FAQ", href: "/faq" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Terms", href: "/terms" },
          { label: "Privacy", href: "/privacy" },
          { label: "Refund Policy", href: "/refund-policy" },
        ],
      },
    ],
  },
}
