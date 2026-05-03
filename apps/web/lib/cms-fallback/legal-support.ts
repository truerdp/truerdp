import type { CmsPage } from "@/lib/cms-types"

export const fallbackRefundPolicyPage: CmsPage = {
  slug: "refund-policy",
  title: "Refund Policy",
  summary: "Refund terms for purchases and renewals.",
  content: {
    body: [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Eligibility" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Refund eligibility depends on service usage and timing from purchase.",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Review" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Requests are reviewed case-by-case by support and admin.",
          },
        ],
        markDefs: [],
      },
    ],
  },
  seoTitle: "Refund Policy | TrueRDP",
  seoDescription: "Refund terms for TrueRDP plans and renewals.",
}

export const fallbackContactPage: CmsPage = {
  slug: "contact",
  title: "Contact & Support",
  summary: "Ways to reach support and open tickets.",
  content: {
    body: [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Support tickets" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Open a ticket from your dashboard support page for issue tracking.",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Response windows" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Our team responds based on queue priority and operational impact.",
          },
        ],
        markDefs: [],
      },
    ],
  },
  seoTitle: "Contact & Support | TrueRDP",
  seoDescription: "Reach TrueRDP support for billing or provisioning help.",
}
