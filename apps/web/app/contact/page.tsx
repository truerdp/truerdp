import type { Metadata } from "next"

import { getCmsPage } from "@/lib/cms"
import { ContactHeroAndCards } from "@/components/contact/contact-hero-and-cards"
import { ContactSupportSections } from "@/components/contact/contact-support-sections"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("contact")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "Contact and support",
  }
}

export default async function ContactPage() {
  const page = await getCmsPage("contact")

  return (
    <main className="relative isolate flex-1 overflow-hidden bg-[linear-gradient(180deg,oklch(0.985_0.022_205)_0%,oklch(0.975_0.02_84)_48%,oklch(0.985_0.018_166)_100%)] pb-14 dark:bg-[linear-gradient(180deg,oklch(0.17_0.04_252)_0%,oklch(0.14_0.032_240)_54%,oklch(0.16_0.036_220)_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-130 bg-[linear-gradient(115deg,oklch(0.95_0.05_78/0.56)_0%,transparent_34%),linear-gradient(245deg,oklch(0.82_0.075_205/0.42)_0%,transparent_44%)]" />
      <ContactHeroAndCards title={page.title} />
      <ContactSupportSections />
    </main>
  )
}
