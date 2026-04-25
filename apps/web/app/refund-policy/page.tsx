import type { Metadata } from "next"
import CmsContentPage from "@/components/cms-content-page"
import { getCmsPage } from "@/lib/cms"

export async function generateMetadata(): Promise<Metadata> {
  const page = await getCmsPage("refund-policy")
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.summary || "Refund policy",
  }
}

export default async function RefundPolicyPage() {
  return <CmsContentPage slug="refund-policy" />
}
