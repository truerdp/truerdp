import { readRecord, readText } from "@/lib/homepage-content/utils"

export function buildSecondaryHomeSections(
  cmsContent: Record<string, unknown>
) {
  const cmsTestimonialsSection = readRecord(cmsContent.testimonialsSection)
  const cmsTestimonialsItems = Array.isArray(cmsTestimonialsSection.items)
    ? (cmsTestimonialsSection.items as Array<Record<string, unknown>>)
    : []
  const testimonialsSection = {
    eyebrow: readText(cmsTestimonialsSection.eyebrow, "5 star rated experience"),
    headline: readText(
      cmsTestimonialsSection.headline,
      "Trusted by buyers who need clear specs and quick checkout"
    ),
    ratingLabel: readText(cmsTestimonialsSection.ratingLabel, "Rated 5.0 by customers"),
    items:
      cmsTestimonialsItems.length > 0
        ? cmsTestimonialsItems
            .map((item) => ({
              quote: readText(item.quote, ""),
              name: readText(item.name, ""),
              role: readText(item.role, ""),
            }))
            .filter((item) => item.quote && item.name)
        : [
            {
              quote:
                "The plan cards made it easy to compare capacity and get into checkout without a slow quote process.",
              name: "Arjun M.",
              role: "Automation operator",
            },
            {
              quote:
                "We needed remote Windows capacity quickly. TrueRDP gave us clear durations, specs, and locations up front.",
              name: "Meera S.",
              role: "Operations lead",
            },
            {
              quote:
                "The buying flow is simple, and the resource details are visible before payment. That saves a lot of back-and-forth.",
              name: "Daniel K.",
              role: "Trading desk admin",
            },
          ],
  }

  const cmsFaqPreviewSection = readRecord(cmsContent.faqPreviewSection)
  const cmsFaqPreviewItems = Array.isArray(cmsFaqPreviewSection.items)
    ? (cmsFaqPreviewSection.items as Array<Record<string, unknown>>)
    : []
  const faqPreviewSection = {
    eyebrow: readText(cmsFaqPreviewSection.eyebrow, "Quick answers"),
    headline: readText(
      cmsFaqPreviewSection.headline,
      "Know what happens before you choose a plan"
    ),
    description: readText(
      cmsFaqPreviewSection.description,
      "The common buying questions are answered up front, and the full FAQ is available when you need more detail."
    ),
    ctaLabel: readText(cmsFaqPreviewSection.ctaLabel, "Open full FAQ"),
    items:
      cmsFaqPreviewItems.length > 0
        ? cmsFaqPreviewItems
            .map((item) => ({
              question: readText(item.question, ""),
              answer: readText(item.answer, ""),
            }))
            .filter((item) => item.question && item.answer)
        : [
            {
              question: "How quickly can I place an order?",
              answer:
                "Choose a plan duration, start checkout, and the order is created in the same flow. Provisioning follows the current admin confirmation process.",
            },
            {
              question: "Can I compare plans by location?",
              answer:
                "Yes. The homepage and plans catalog both group inventory by plan type and deployment location so you can evaluate latency and geography before checkout.",
            },
            {
              question: "What details are shown before payment?",
              answer:
                "Plan cards show CPU, RAM, storage, location, plan type, and available durations so you can choose without hidden assumptions.",
            },
          ],
  }

  const cmsLiveSupportSection = readRecord(cmsContent.liveSupportSection)
  const cmsLiveSupportTopics = Array.isArray(cmsLiveSupportSection.topics)
    ? (cmsLiveSupportSection.topics as Array<Record<string, unknown>>)
    : []
  const liveSupportSection = {
    eyebrow: readText(cmsLiveSupportSection.eyebrow, "Live support"),
    headline: readText(
      cmsLiveSupportSection.headline,
      "Need help choosing capacity? Chat with support before checkout."
    ),
    description: readText(
      cmsLiveSupportSection.description,
      "Tawk.to live chat is ready for the marketing site. Use the chat widget for plan fit, order questions, and provisioning status."
    ),
    topics:
      cmsLiveSupportTopics.length > 0
        ? cmsLiveSupportTopics
            .map((item) => ({
              title: readText(item.title, ""),
              description: readText(item.description, ""),
            }))
            .filter((item) => item.title)
        : [
            {
              title: "Plan fit",
              description: "Support for buyers and active customers.",
            },
            {
              title: "Order questions",
              description: "Support for buyers and active customers.",
            },
            {
              title: "Provisioning status",
              description: "Support for buyers and active customers.",
            },
          ],
  }

  const cmsFinalCta = readRecord(cmsContent.finalCta)
  const finalCta = {
    headline: readText(
      cmsFinalCta.headline,
      "Ready to launch a cleaner RDP workspace?"
    ),
    description: readText(
      cmsFinalCta.description,
      "Pick a plan that fits your workload, choose the duration, and move into payment with the core details already visible."
    ),
    primaryCtaLabel: readText(cmsFinalCta.primaryCtaLabel, "Start now"),
    secondaryCtaLabel: readText(cmsFinalCta.secondaryCtaLabel, "Talk to support"),
  }

  return {
    testimonialsSection,
    faqPreviewSection,
    liveSupportSection,
    finalCta,
  }
}
