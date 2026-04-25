import type { Metadata } from "next"
import CmsContentPage from "@/components/cms-content-page"
import { getCmsPage } from "@/lib/cms"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("faq")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "FAQ",
  }
}

export default async function FaqPage() {
  return <CmsContentPage slug="faq" />
}
