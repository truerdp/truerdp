import type { CmsPage } from "@/lib/cms-types"

export const fallbackFaqPage: CmsPage = {
  slug: "faq",
  title: "Frequently Asked Questions",
  summary: "Common answers about plans, payments, and provisioning.",
  content: {
    items: [
      {
        question: "How quickly are instances provisioned?",
        answer:
          "After payment confirmation, admin provisions and assigns a server. Provisioning time depends on queue and inventory.",
      },
      {
        question: "Can I renew before expiry?",
        answer:
          "Yes. Renewals extend your expiry date. Suspended instances must be unsuspended before renewal.",
      },
      {
        question: "Which payment methods are available?",
        answer:
          "Available methods include UPI, USDT TRC20, Dodo checkout, and CoinGate checkout based on configuration.",
      },
    ],
  },
  seoTitle: "FAQ | TrueRDP",
  seoDescription: "Answers to common questions about plans and billing.",
}
