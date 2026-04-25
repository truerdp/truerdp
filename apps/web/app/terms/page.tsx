import type { Metadata } from "next"
import CmsContentPage from "@/components/cms-content-page"
import { getCmsPage } from "@/lib/cms"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("terms")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "Terms of service",
  }
}

export default async function TermsPage() {
  return <CmsContentPage slug="terms" />
}
