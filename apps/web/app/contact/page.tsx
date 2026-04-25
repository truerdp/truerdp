import type { Metadata } from "next"
import CmsContentPage from "@/components/cms-content-page"
import { getCmsPage } from "@/lib/cms"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("contact")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "Contact and support",
  }
}

export default async function ContactPage() {
  return <CmsContentPage slug="contact" />
}
