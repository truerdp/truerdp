import type { CmsPage } from "@/lib/cms-types"

export const fallbackTermsPage: CmsPage = {
  slug: "terms",
  title: "Terms of Service",
  summary: "Terms and conditions for using TrueRDP.",
  content: {
    body: [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Service usage" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Use the service lawfully and in accordance with acceptable use requirements.",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Billing" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Orders are billed according to selected plan pricing and duration.",
          },
        ],
        markDefs: [],
      },
    ],
  },
  seoTitle: "Terms of Service | TrueRDP",
  seoDescription: "Terms and conditions for TrueRDP services.",
}

export const fallbackPrivacyPage: CmsPage = {
  slug: "privacy",
  title: "Privacy Policy",
  summary: "How TrueRDP handles personal data.",
  content: {
    body: [
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Data collected" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "We collect account, billing, and operational data needed to provide the service.",
          },
        ],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Data usage" }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [
          {
            _type: "span",
            text: "Data is used for account management, provisioning, support, and security.",
          },
        ],
        markDefs: [],
      },
    ],
  },
  seoTitle: "Privacy Policy | TrueRDP",
  seoDescription: "How TrueRDP collects, uses, and protects data.",
}
